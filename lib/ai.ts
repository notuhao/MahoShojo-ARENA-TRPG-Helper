// lib/ai.ts

import { streamObject, NoObjectGeneratedError } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { config, AIProvider } from "./config";
import { getLogger } from "./logger";

/**
 * @fileoverview AI服务核心模块
 * @description 封装了多AI提供商支持、负载均衡、故障转移和重试逻辑。
 * 此版本修复了因AI SDK版本升级导致的兼容性问题。
 */

// 延迟函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const log = getLogger('ai-service');

// 通用生成配置接口
export interface GenerationConfig<T, I = any> {
  systemPrompt: string;
  temperature: number;
  promptBuilder: (input: I) => string;
  schema: z.ZodSchema<T>;
  taskName: string;
  maxTokens: number;
  modelOverride?: string; // 允许API层根据需求（如“轻量模型”）覆盖默认模型
}

// 根据提供商配置创建对应的AI客户端实例
const createAIClient = (provider: AIProvider) => {
  if (provider.type === 'google') {
    return createGoogleGenerativeAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    });
  } else {
    // 【修正 #1】移除不再支持的 compatibility 属性
    return createOpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    });
  }
};

// Fisher-Yates 洗牌算法，用于随机化提供商顺序
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 根据权重随机选择提供商，权重越大概率越高
function weightedRandomSelect<T extends { weight?: number }>(items: T[]): T[] {
  if (items.length === 0) return [];
  if (!items.some(item => item.weight)) {
    return shuffleArray(items);
  }
  return [...items].sort((a, b) => (b.weight || 1) - (a.weight || 1));
}

// 从单个提供商的多个模型配置中随机选择一个
function selectRandomModel(models: string | string[]): string {
  if (typeof models === 'string') return models;
  if (Array.isArray(models) && models.length > 0) {
    return models[Math.floor(Math.random() * models.length)];
  }
  throw new Error('无效的模型配置');
}

// 展开多模型配置，为每个模型创建独立的提供商实例，便于负载均衡
function expandProviders(providers: AIProvider[]): AIProvider[] {
  const expanded: AIProvider[] = [];
  providers.forEach(p => {
    if (Array.isArray(p.model)) {
      p.model.forEach(model => expanded.push({ ...p, model }));
    } else {
      expanded.push(p);
    }
  });
  return expanded;
}

/**
 * 通用AI流式生成函数
 * @param input - 传递给 promptBuilder 的输入数据
 * @param generationConfig - 本次生成的详细配置
 * @returns 返回一个可读的流 (ReadableStream)
 */
export async function streamWithAI<T, I = any>(
  input: I,
  generationConfig: GenerationConfig<T, I>
): Promise<ReadableStream> {
  const providers = expandProviders(config.PROVIDERS);
  if (providers.length === 0) {
    log.error("AI服务未配置: 环境变量 AI_PROVIDERS_CONFIG 为空。");
    throw new Error("AI服务未配置");
  }

  let providersToTry: AIProvider[];
  switch (config.LOAD_BALANCE_STRATEGY) {
    case 'random':
      providersToTry = weightedRandomSelect(providers);
      break;
    default: // sequential
      providersToTry = providers;
  }

  let lastError: any = new Error("所有AI提供商均生成失败。");

  for (const provider of providersToTry) {
    const retryCount = provider.retryCount ?? 1;
    const selectedModel = generationConfig.modelOverride || selectRandomModel(provider.model);
    log.info(`尝试提供商: ${provider.name}, 模型: ${selectedModel}`);

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const llm = createAIClient(provider);
        const result = await streamObject({
          model: llm(selectedModel),
          schema: generationConfig.schema,
          system: generationConfig.systemPrompt,
          prompt: generationConfig.promptBuilder(input),
          temperature: generationConfig.temperature,
          maxTokens: generationConfig.maxTokens,
          mode: provider.mode || 'auto',
        });
        log.info(`提供商 ${provider.name} 成功响应 (尝试 ${attempt}/${retryCount})`);
        
        // 【修正 #2】新版SDK直接返回 partialObjectStream
        return result.partialObjectStream;

      } catch (error) {
        lastError = error;
        log.warn(`提供商 ${provider.name} 尝试 ${attempt}/${retryCount} 失败`, { error });
        if (NoObjectGeneratedError.isInstance(error)) {
            log.warn('AI返回内容无法解析为JSON', { text: error.text });
        }
        if (attempt < retryCount) await sleep(200); // 重试前稍作等待
      }
    }
  }

  log.error("所有AI提供商均失败", { lastError });
  throw lastError;
}