// pages/api/ai/gm-turn.ts

import { getLogger } from '@/lib/logger';
import { config as serviceConfig } from '@/lib/config';
import { gmTurnRequestSchema } from '@/lib/schemas/gmTurnSchemas';
import {
  enforcePauseContract,
  hasManualResults,
  assertManualResultsApplied,
} from '@/lib/trpg/gmTurnContext';
import { generateGmResponse } from '@/lib/trpg/gmTwoStagePipeline';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

const log = getLogger('api/ai/gm-turn');

export default async function handler(req: NextRequest) {
  const requestStartedAt = Date.now();
  log.info('收到 GM 轮次请求');
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const json = await req.json();
    const parsed = gmTurnRequestSchema.safeParse(json);

    if (!parsed.success) {
      log.warn('GM轮次请求校验失败', { issues: parsed.error.flatten() });
      return new Response(
        JSON.stringify({
          error: '请求参数不合法',
          issues: parsed.error.flatten(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const parsedRequest = parsed.data;
    log.debug('GM轮次请求解析成功', {
      characters: parsedRequest.full_character_sheets.length,
      historyCount: parsedRequest.conversation_history.length,
      hasManual: !!parsedRequest.manual_adjudication_results?.length,
    });
    if (!parsedRequest.provider_config && serviceConfig.OFFICIAL_MODELS.length > 0) {
      const requestedModels = [
        parsedRequest.model_preference,
        parsedRequest.stage_model_preferences?.draft,
        parsedRequest.stage_model_preferences?.formatter,
      ].filter((value): value is string => Boolean(value));

      for (const modelId of requestedModels) {
        const allowed = serviceConfig.OFFICIAL_MODELS.some((option) => option.id === modelId);
        if (!allowed) {
          return new Response(
            JSON.stringify({
              error: `请求的模型 ${modelId} 未被列入允许名单`,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      }
    }

    const { response: payload, draft } = await generateGmResponse(parsedRequest);
    if (draft) {
      log.debug('GM第一阶段草稿已生成', { excerpt: draft.slice(0, 200) });
    }
    const manualProvided = hasManualResults(parsedRequest);
    let normalizedResponse = enforcePauseContract(payload, manualProvided);
    if (manualProvided) {
      normalizedResponse = assertManualResultsApplied(
        normalizedResponse,
        parsedRequest.manual_adjudication_results,
      );
    }
    log.info('GM轮次响应已生成', {
      narrativeLength: normalizedResponse.narrative_chunk.length,
      stateUpdates: normalizedResponse.state_updates.length,
      pause: normalizedResponse.pause_at_node,
      pauseReason: normalizedResponse.pause_reason,
      durationMs: Date.now() - requestStartedAt,
    });
    return new Response(JSON.stringify(normalizedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log.error('GM轮次生成失败', { error: error?.message });
    const isConfigError =
      typeof error?.message === 'string' &&
      (error.message.includes('未找到支持模型') || error.message.includes('未被列入允许名单'));
    log.error('GM轮次生成失败', {
      durationMs: Date.now() - requestStartedAt,
      details: error?.message,
    });
    return new Response(
      JSON.stringify({
        error: isConfigError ? '请求的模型未在服务器配置中启用。' : 'GM轮次生成失败，请稍后重试。',
        details: error?.message ?? '未知错误',
      }),
      {
        status: isConfigError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
