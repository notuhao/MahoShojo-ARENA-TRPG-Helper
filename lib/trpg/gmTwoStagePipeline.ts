import { z } from 'zod';
import { streamWithAI, type GenerationConfig } from '@/lib/ai';
import { config, AIProvider } from '@/lib/config';
import { getLogger } from '@/lib/logger';
import {
  buildGmDraftPrompt,
  buildGmFormatterPrompt,
  buildGmUserPrompt,
} from '@/lib/trpg/gmTurnContext';
import {
  buildGmDraftSystemPrompt,
  buildGmSystemPrompt,
} from '@/lib/trpg/gmSystemPrompt';
import {
  type GmTurnRequest,
  type GmTurnResponse,
  gmTurnResponseSchema,
} from '@/lib/schemas/gmTurnSchemas';
import { AI_PROVIDER_CATALOG } from '@/lib/ai/constants';

const log = getLogger('ai/two-stage');

const hasProviderForModel = (modelId: string) =>
  config.PROVIDERS.some((provider) => {
    const models = Array.isArray(provider.model) ? provider.model : [provider.model];
    return models.includes(modelId);
  });

const gmDraftSchema = z.object({
  draft: z.string().min(10, '草稿内容过短，请补充完整叙事'),
});

type DraftPayload = z.infer<typeof gmDraftSchema>;

const draftGenerationConfig: GenerationConfig<DraftPayload, { prompt: string }> = {
  systemPrompt: buildGmDraftSystemPrompt(),
  promptBuilder: (input) => input.prompt,
  schema: gmDraftSchema,
  taskName: 'GM草稿推演',
  temperature: 0.7,
  maxTokens: 2048,
  preferStreaming: false,
};

const formatterBaseConfig: GenerationConfig<GmTurnResponse, { prompt: string }> = {
  systemPrompt: buildGmSystemPrompt(),
  promptBuilder: (input) => input.prompt,
  schema: gmTurnResponseSchema,
  taskName: 'GM结果格式化',
  temperature: 0.4,
  maxTokens: 2048,
  preferStreaming: false,
};

const resolveProviderConfigForStage = (
  request: GmTurnRequest,
  stage: 'draft' | 'formatter',
): GmTurnRequest['provider_config'] | undefined => {
  if (request.stage_provider_configs?.[stage]) {
    return request.stage_provider_configs[stage] ?? undefined;
  }
  return request.provider_config;
};

function createProviderOverride(
  providerConfig: GmTurnRequest['provider_config'],
  stage: 'draft' | 'formatter',
): AIProvider | undefined {
  if (!providerConfig || !providerConfig.providerId || providerConfig.providerId === 'system') {
    return undefined;
  }

  const catalogItem = AI_PROVIDER_CATALOG.find(p => p.id === providerConfig.providerId);
  if (!catalogItem) {
    log.warn(`未找到 ID 为 ${providerConfig.providerId} 的提供商配置`);
    return undefined;
  }

  const stageModelId = stage === 'draft'
    ? providerConfig.stage1ModelId || providerConfig.modelId
    : providerConfig.stage2ModelId || providerConfig.stage1ModelId || providerConfig.modelId;

  if (!stageModelId) {
    log.warn(`提供商 ${providerConfig.providerId} 未为阶段 ${stage} 指定模型`);
    return undefined;
  }

  return {
    name: catalogItem.name,
    apiKey: providerConfig.apiKey || '',
    baseUrl: catalogItem.baseUrl,
    model: stageModelId,
    type: catalogItem.type,
    mode: catalogItem.mode,
    retryCount: 1,
    skipProbability: 0,
  };
}

async function runFormatterWithModel(
  prompt: string,
  modelOverride?: string,
  providerOverride?: AIProvider
): Promise<GmTurnResponse> {
  const streamOptions = providerOverride ? { providerOverride } : undefined;
  const result = await streamWithAI({ prompt }, {
    ...formatterBaseConfig,
    modelOverride,
  }, streamOptions);
  return await result.object;
}

async function runSecondStage(
  prompt: string,
  preferredModel?: string,
  providerOverride?: AIProvider
): Promise<GmTurnResponse> {
  if (providerOverride) {
    return await runFormatterWithModel(prompt, preferredModel, providerOverride);
  }

  const candidates: string[] = [];
  if (preferredModel) {
    candidates.push(preferredModel);
  }
  if (config.GM_TURN_TWO_STAGE_MODE === 'separate-model') {
    candidates.push(...config.GM_TURN_FORMATTING_MODEL_PRIORITY);
  }

  const uniqueCandidates = candidates
    .filter((model): model is string => Boolean(model))
    .filter((model, index, arr) => arr.indexOf(model) === index && hasProviderForModel(model));

  for (const candidate of uniqueCandidates) {
    try {
      log.debug(`尝试使用格式化模型 ${candidate}`);
      return await runFormatterWithModel(prompt, candidate);
    } catch (error) {
      log.warn(`格式化模型 ${candidate} 失败，尝试下一个`, { error });
    }
  }

  if (preferredModel && uniqueCandidates.length === 0) {
    log.debug('未找到匹配配置的格式化模型，使用默认策略');
  }

  return runFormatterWithModel(prompt);
}

async function runStageOne(
  prompt: string,
  modelOverride?: string,
  providerOverride?: AIProvider
): Promise<DraftPayload> {
  const streamOptions = providerOverride ? { providerOverride } : undefined;
  const result = await streamWithAI({ prompt }, {
    ...draftGenerationConfig,
    modelOverride,
  }, streamOptions);
  log.debug('GM两段式：等待第一阶段对象解析');
  const draft = await result.object;
  log.debug('GM两段式：第一阶段对象已解析');
  return draft;
}

async function runSingleStage(
  request: GmTurnRequest,
  prompt: string,
  providerOverride?: AIProvider,
  modelOverride?: string,
): Promise<GmTurnResponse> {
  const streamOptions = providerOverride ? { providerOverride } : undefined;
  const result = await streamWithAI({ prompt }, {
    ...formatterBaseConfig,
    modelOverride: modelOverride ?? request.model_preference,
  }, streamOptions);
  log.debug('GM单阶段：等待对象解析');
  const response = await result.object;
  log.debug('GM单阶段：对象已解析');
  return response;
}

export const generateGmResponse = async (
  request: GmTurnRequest,
): Promise<{ response: GmTurnResponse; draft?: string }> => {
  const draftModelPreference = request.stage_model_preferences?.draft
    ?? request.model_preference
    ?? config.GM_STAGE1_DEFAULT_MODEL;
  const formatterModelPreference = request.stage_model_preferences?.formatter
    ?? config.GM_STAGE2_DEFAULT_MODEL;

  const providerOverrideDraft = createProviderOverride(resolveProviderConfigForStage(request, 'draft'), 'draft');
  const providerOverrideFormatter = createProviderOverride(resolveProviderConfigForStage(request, 'formatter'), 'formatter');
  const twoStageMode = config.GM_TURN_TWO_STAGE_MODE;

  if (twoStageMode === 'disabled') {
    const prompt = buildGmUserPrompt(request);
    log.debug('GM两段式：单阶段模式，直接生成');
    return { response: await runSingleStage(request, prompt, providerOverrideDraft, draftModelPreference) };
  }

  const draftPrompt = buildGmDraftPrompt(request);
  let draftPayload: DraftPayload;

  try {
    log.debug('GM两段式：开始第一阶段草稿生成');
    draftPayload = await runStageOne(draftPrompt, draftModelPreference, providerOverrideDraft);
    log.debug('GM两段式：第一阶段完成', { draftLength: draftPayload.draft.length });
  } catch (draftError) {
    log.error('GM 第一阶段草稿生成失败，回退至单阶段模式', { error: draftError });
    const fallbackPrompt = buildGmUserPrompt(request);
    return { response: await runSingleStage(request, fallbackPrompt, providerOverrideDraft, draftModelPreference) };
  }

  const formatterPrompt = buildGmFormatterPrompt(request, draftPayload.draft);

  try {
    log.debug('GM两段式：开始第二阶段结构化');
    const formatterResponse = await runSecondStage(
      formatterPrompt,
      formatterModelPreference,
      providerOverrideFormatter,
    );
    log.debug('GM两段式：第二阶段完成', {
      narrativeLength: formatterResponse.narrative_chunk.length,
      stateUpdates: formatterResponse.state_updates.length,
    });
    return { response: formatterResponse, draft: draftPayload.draft };
  } catch (formatError) {
    log.error('GM 第二阶段格式化失败，回退至单阶段模式', { error: formatError });
    const fallbackPrompt = buildGmUserPrompt(request);
    const fallbackResponse = await runSingleStage(request, fallbackPrompt, providerOverrideDraft, draftModelPreference);
    return { response: fallbackResponse, draft: draftPayload.draft };
  }
};
