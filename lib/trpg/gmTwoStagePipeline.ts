import { z } from 'zod';
import { streamWithAI, type GenerationConfig } from '@/lib/ai';
import { config } from '@/lib/config';
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

async function runFormatterWithModel(prompt: string, modelOverride?: string): Promise<GmTurnResponse> {
  const result = await streamWithAI({ prompt }, {
    ...formatterBaseConfig,
    modelOverride,
  });
  return await result.object;
}

async function runSecondStage(prompt: string, preferredModel?: string): Promise<GmTurnResponse> {
  const mode = config.GM_TURN_TWO_STAGE_MODE;
  if (mode === 'separate-model') {
    const priority = config.GM_TURN_FORMATTING_MODEL_PRIORITY;
    const candidates = [...priority, preferredModel].filter(Boolean) as string[];
    const uniqueCandidates = candidates.filter((model, index, arr) => {
      const firstIndex = arr.indexOf(model);
      return firstIndex === index && hasProviderForModel(model);
    });
    if (uniqueCandidates.length > 0) {
      for (const model of uniqueCandidates) {
        try {
          log.debug(`尝试使用格式化模型 ${model}`);
          return await runFormatterWithModel(prompt, model);
        } catch (error) {
          log.warn(`格式化模型 ${model} 失败，尝试下一个`, { error });
        }
      }
    } else {
      log.debug('未找到匹配配置的格式化模型，使用默认策略');
    }
  } else if (preferredModel) {
    try {
      return await runFormatterWithModel(prompt, preferredModel);
    } catch (error) {
      log.warn(`格式化阶段使用模型 ${preferredModel} 失败，回退默认策略`, { error });
    }
  }
  return runFormatterWithModel(prompt);
}

async function runStageOne(request: GmTurnRequest, prompt: string): Promise<DraftPayload> {
  const result = await streamWithAI({ prompt }, {
    ...draftGenerationConfig,
    modelOverride: request.model_preference,
  });
  log.debug('GM两段式：等待第一阶段对象解析');
  const draft = await result.object;
  log.debug('GM两段式：第一阶段对象已解析');
  return draft;
}

async function runSingleStage(request: GmTurnRequest, prompt: string): Promise<GmTurnResponse> {
  const result = await streamWithAI({ prompt }, {
    ...formatterBaseConfig,
    modelOverride: request.model_preference,
  });
  log.debug('GM单阶段：等待对象解析');
  const response = await result.object;
  log.debug('GM单阶段：对象已解析');
  return response;
}

export const generateGmResponse = async (
  request: GmTurnRequest,
): Promise<{ response: GmTurnResponse; draft?: string }> => {
  if (config.GM_TURN_TWO_STAGE_MODE === 'disabled') {
    const prompt = buildGmUserPrompt(request);
    log.debug('GM两段式：单阶段模式，直接生成');
    return { response: await runSingleStage(request, prompt) };
  }

  const draftPrompt = buildGmDraftPrompt(request);
  let draftPayload: DraftPayload;

  try {
    log.debug('GM两段式：开始第一阶段草稿生成');
    draftPayload = await runStageOne(request, draftPrompt);
    log.debug('GM两段式：第一阶段完成', { draftLength: draftPayload.draft.length });
  } catch (draftError) {
    log.error('GM 第一阶段草稿生成失败，回退至单阶段模式', { error: draftError });
    const fallbackPrompt = buildGmUserPrompt(request);
    return { response: await runSingleStage(request, fallbackPrompt) };
  }

  const formatterPrompt = buildGmFormatterPrompt(request, draftPayload.draft);

  try {
    log.debug('GM两段式：开始第二阶段结构化');
    const formatterResponse = await runSecondStage(formatterPrompt, request.model_preference);
    log.debug('GM两段式：第二阶段完成', {
      narrativeLength: formatterResponse.narrative_chunk.length,
      stateUpdates: formatterResponse.state_updates.length,
    });
    return { response: formatterResponse, draft: draftPayload.draft };
  } catch (formatError) {
    log.error('GM 第二阶段格式化失败，回退至单阶段模式', { error: formatError });
    const fallbackPrompt = buildGmUserPrompt(request);
    const fallbackResponse = await runSingleStage(request, fallbackPrompt);
    return { response: fallbackResponse, draft: draftPayload.draft };
  }
};
