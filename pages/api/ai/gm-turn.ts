// pages/api/ai/gm-turn.ts

import { streamWithAI, type GenerationConfig } from '@/lib/ai';
import { getLogger } from '@/lib/logger';
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

    const systemPrompt = buildGmSystemPrompt();
    const userPrompt = buildGmUserPrompt(parsedRequest);

    const generationConfig: GenerationConfig<GmTurnResponse, { prompt: string }> = {
      systemPrompt,
      promptBuilder: (input) => input.prompt,
      schema: gmTurnResponseSchema,
      temperature: 0.7,
      maxTokens: 2048,
      taskName: 'GM关键节点推演',
      modelOverride: undefined,
    };

    const result = await streamWithAI({ prompt: userPrompt }, generationConfig);
    const payload = await result.object;
    const sanitizedResponse = enforcePauseContract(payload, hasManualResults(parsedRequest));

    return new Response(JSON.stringify(sanitizedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log.error('GM轮次生成失败', { error: error?.message });
    return new Response(
      JSON.stringify({
        error: 'GM轮次生成失败，请稍后重试。',
        details: error?.message ?? '未知错误',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
