// pages/api/ai/gm-turn.ts

import { streamWithAI, type GenerationConfig } from '@/lib/ai';
import { getLogger } from '@/lib/logger';
import { config as serviceConfig } from '@/lib/config';
import {
  gmTurnRequestSchema,
  gmTurnResponseSchema,
  type GmTurnRequest,
  type GmTurnResponse,
} from '@/lib/schemas/gmTurnSchemas';
import { buildGmSystemPrompt } from '@/lib/trpg/gmSystemPrompt';
import {
  buildGmUserPrompt,
  enforcePauseContract,
  hasManualResults,
  assertManualResultsApplied,
} from '@/lib/trpg/gmTurnContext';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

const log = getLogger('api/ai/gm-turn');

export default async function handler(req: NextRequest) {
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
    if (
      parsedRequest.model_preference &&
      serviceConfig.OFFICIAL_MODELS.length > 0 &&
      !serviceConfig.OFFICIAL_MODELS.some((option) => option.id === parsedRequest.model_preference)
    ) {
      throw new Error(`请求的模型 ${parsedRequest.model_preference} 未被列入允许名单`);
    }

    const systemPrompt = buildGmSystemPrompt();
    const userPrompt = buildGmUserPrompt(parsedRequest);

    const generationConfig: GenerationConfig<GmTurnResponse, { prompt: string }> = {
      systemPrompt,
      promptBuilder: (input) => input.prompt,
      schema: gmTurnResponseSchema,
      temperature: 0.7,
      maxTokens: 2048,
      taskName: 'GM关键节点推演',
      modelOverride: parsedRequest.model_preference,
    };

    const result = await streamWithAI({ prompt: userPrompt }, generationConfig);
    const payload = await result.object;
    const manualProvided = hasManualResults(parsedRequest);
    const sanitizedResponse = enforcePauseContract(payload, manualProvided);
    if (manualProvided) {
      assertManualResultsApplied(sanitizedResponse, parsedRequest.manual_adjudication_results);
    }

    return new Response(JSON.stringify(sanitizedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log.error('GM轮次生成失败', { error: error?.message });
    const isConfigError =
      typeof error?.message === 'string' &&
      (error.message.includes('未找到支持模型') || error.message.includes('未被列入允许名单'));
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
