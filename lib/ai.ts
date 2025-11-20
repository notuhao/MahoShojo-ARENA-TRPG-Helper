// lib/ai.ts

import { streamObject, NoObjectGeneratedError, StreamObjectResult, generateObject, simulateReadableStream } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { config, AIProvider } from "./config";
import { getLogger } from "./logger";
import { getProviderFetch } from "./ai/middleware/provider-fetch";
import { jsonrepair } from 'jsonrepair';

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
  preferStreaming?: boolean; // 为 true 或未设置时使用流式解析，为 false 时直接同步生成
}

export interface GenerateWithAIOptions {
  loadBalanceStrategy?: LoadBalanceStrategy;
  providerOverride?: AIProvider;
}

/**
 * 负载均衡策略枚举
 */
export enum LoadBalanceStrategy {
  SEQUENTIAL = 'sequential',  // 顺序执行（原有逻辑）
  RANDOM = 'random',         // 随机选择
  ROUND_ROBIN = 'round_robin', // 轮询（暂时不实现）
  CUSTOM = 'custom'        // 自定义（使用用户自定义模型，不进行轮询）
}

// 全局轮询计数器（用于轮询策略）
let roundRobinCounter = 0;

// 根据提供商配置创建对应的AI客户端实例
const createAIClient = (provider: AIProvider) => {
  if (provider.type === 'google') {
    return createGoogleGenerativeAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    });
  } else {
    return createOpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      compatibility: "compatible",
      fetch: getProviderFetch(provider),
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

  const sorted = [...items].sort((a, b) => {
    const weightA = a.weight || 1;
    const weightB = b.weight || 1;
    // 添加随机因子，权重高的更容易被选中，但不是绝对的
    return (weightB + Math.random() * 0.5) - (weightA + Math.random() * 0.5);
  });

  return sorted;
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
      p.model.forEach((model, index) => {
        expanded.push({
          ...p,
          name: `${p.name}_model_${index + 1}`,
          model,
          weight: p.weight || 1
        });
      });
    } else {
      expanded.push(p);
    }
  });
  return expanded;
}

function modelMatches(provider: AIProvider, preferredModel?: string) {
  if (!preferredModel) return true;
  if (typeof provider.model === 'string') {
    return provider.model === preferredModel;
  }
  if (Array.isArray(provider.model)) {
    return provider.model.includes(preferredModel);
  }
  return false;
}

function filterProvidersByModel(baseProviders: AIProvider[], preferredModel?: string) {
  if (!preferredModel) return baseProviders;
  return baseProviders.filter((provider) => modelMatches(provider, preferredModel));
}

const stripJsonFences = (text: string) =>
  text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

/**
 * 通用AI流式生成函数
 * @param input - 传递给 promptBuilder 的输入数据
 * @param generationConfig - 本次生成的详细配置
 * @param options - 额外的生成选项，如负载均衡策略或提供商覆盖
 * @returns 返回一个包含流和元数据的 StreamObjectResult 对象
 */
export async function streamWithAI<T, I = any>(
  input: I,
  generationConfig: GenerationConfig<T, I>,
  options?: GenerateWithAIOptions
) {
  const overrideModel = generationConfig.modelOverride;

  const baseProviders: AIProvider[] = [
    ...(options?.providerOverride ? [options.providerOverride] : []),
    ...config.PROVIDERS,
  ];

  if (baseProviders.length === 0) {
    log.error("AI服务未配置或无匹配模型: 环境变量 AI_PROVIDERS_CONFIG 为空或 model_preference 无效。");
    throw new Error(overrideModel ? `未找到支持模型 ${overrideModel} 的提供商` : "AI服务未配置");
  }

  if (options?.providerOverride) {
    log.info(`优先使用用户自定义提供商: ${options.providerOverride.name}`);
  }

  // 展开多模型配置
  const expandedProviders = expandProviders(filterProvidersByModel(baseProviders, overrideModel));

  // 如果有模型覆盖，记录日志
  if (overrideModel) {
    log.info(`使用模型覆盖: ${overrideModel}`);
  }

  // 如果没有指定策略，从配置中读取
  const strategy = options?.loadBalanceStrategy || (config.LOAD_BALANCE_STRATEGY as LoadBalanceStrategy) || LoadBalanceStrategy.RANDOM;

  let providersToTry: AIProvider[];

  // 根据负载均衡策略决定提供商顺序
  switch (strategy) {
    case LoadBalanceStrategy.RANDOM:
      providersToTry = weightedRandomSelect(expandedProviders);
      break;
    case LoadBalanceStrategy.ROUND_ROBIN:
      const startIndex = roundRobinCounter % expandedProviders.length;
      providersToTry = [
        ...expandedProviders.slice(startIndex),
        ...expandedProviders.slice(0, startIndex)
      ];
      roundRobinCounter++;
      break;
    case LoadBalanceStrategy.CUSTOM:
      // 自定义策略：优先使用用户自定义模型，不进行轮询
      // 注意：这里假设 providerOverride 已经被放入 baseProviders 的第一个位置
      providersToTry = [expandedProviders[0]];
      break;
    case LoadBalanceStrategy.SEQUENTIAL:
    default:
      providersToTry = expandedProviders;
  }

  if (providersToTry.length === 0) {
    // 如果过滤后没有提供商（例如指定了模型但没有提供商支持），尝试使用所有提供商（忽略模型匹配，仅作为最后手段，或者直接报错）
    // 这里选择报错，因为模型不匹配可能会导致严重问题
    log.error("无匹配模型提供商");
    throw new Error(overrideModel ? `未找到支持模型 ${overrideModel} 的提供商` : "AI服务未配置");
  }

  let lastError: any = new Error("所有AI提供商均生成失败。");
  let totalAttempts = 0;

  for (let providerIndex = 0; providerIndex < providersToTry.length; providerIndex++) {
    const provider = providersToTry[providerIndex];

    // 检查是否跳过此提供商（第一个提供商不跳过，除非是自定义策略且不是第一个？）
    // 简单起见，如果是 providerOverride，肯定不跳过
    const isOverride = options?.providerOverride && providerIndex === 0;
    if (!isOverride && providerIndex > 0 && Math.random() < (provider.skipProbability ?? 0)) {
      log.debug('跳过提供商', { name: provider.name, skipProbability: provider.skipProbability });
      continue;
    }

    const retryCount = provider.retryCount ?? 1;
    const selectedModel = overrideModel || selectRandomModel(provider.model);
    log.info(`尝试提供商: ${provider.name}, 模型: ${selectedModel}`);

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      totalAttempts += 1;
      const llm = createAIClient(provider);
      try {
        const systemPrompt = generationConfig.systemPrompt;

        // 修复逻辑：使用 jsonrepair
        const repairText = async ({ text }: { text: string }) => {
          let repaired = text.replace('```json\n', '').replace('\n```', '');
          try {
            repaired = jsonrepair(repaired);
          } catch (e) {
            // ignore
          }
          return stripJsonFences(repaired);
        };

        if (generationConfig.preferStreaming === false) {
          const { object } = await generateObject({
            model: llm(selectedModel),
            schema: generationConfig.schema as z.ZodSchema<T>,
            system: systemPrompt,
            prompt: generationConfig.promptBuilder(input),
            temperature: generationConfig.temperature,
            maxTokens: generationConfig.maxTokens,
            mode: provider.mode || 'json',
            experimental_repairText: repairText,
          });
          log.debug(`提供商 ${provider.name} 成功生成对象 (非流式)`);
          return wrapAsStreamResult(object as T);
        }

        const rawResult = await streamObject({
          model: llm(selectedModel),
          schema: generationConfig.schema as z.ZodSchema<T>,
          system: systemPrompt,
          prompt: generationConfig.promptBuilder(input),
          temperature: generationConfig.temperature,
          maxTokens: generationConfig.maxTokens,
          mode: provider.mode || 'json',
          experimental_repairText: repairText,
        });
        const objectPromise = rawResult.object.then((value) => {
          log.debug(`提供商 ${provider.name} 返回对象已完成`, {
            task: generationConfig.taskName,
            model: selectedModel,
          });
          return value;
        });
        const result = {
          ...rawResult,
          object: objectPromise,
        } as typeof rawResult;
        log.debug(`提供商 ${provider.name} 成功响应 (尝试 ${attempt}/${retryCount})`);

        return result;

      } catch (error) {
        lastError = error;
        log.warn(`提供商 ${provider.name} 尝试 ${attempt}/${retryCount} 失败`, { error });
        if (NoObjectGeneratedError.isInstance(error)) {
          log.warn('AI返回内容无法解析为JSON', { text: error.text });
          const parsed = tryParseFromErrorText(error.text, generationConfig.schema);
          if (parsed) {
            log.info(`提供商 ${provider.name} 通过 error.text 解析成功`);
            return wrapAsStreamResult(parsed as T);
          }
          // 简单的 fallback 尝试
          try {
            const repaired = jsonrepair(error.text);
            const parsedRepaired = JSON.parse(repaired);
            const validated = generationConfig.schema.parse(parsedRepaired);
            log.info(`提供商 ${provider.name} 通过 jsonrepair 解析成功`);
            return wrapAsStreamResult(validated);
          } catch (repairError) {
            // ignore
          }
        }
        if (attempt < retryCount) await sleep(200); // 重试前稍作等待
      }
    }
  }

  log.error("所有AI提供商均失败", { lastError, totalAttempts });
  const failureMessage = `AI 推演失败：共尝试 ${totalAttempts} 次仍未得到有效响应。${lastError?.message ? `最后错误：${lastError.message}` : ''}`;
  throw new Error(failureMessage, { cause: lastError });
}

function tryParseFromErrorText<T>(text: string | undefined, schema: z.ZodSchema<T>) {
  if (!text) return null;
  const cleaned = stripJsonFences(text);
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return schema.parse(parsed);
  } catch (error) {
    log.warn('error.text JSON 解析失败', { error });
    return null;
  }
}

function wrapAsStreamResult<T>(object: T): StreamObjectResult<T, T, any> {
  const emptyStream = simulateReadableStream({ chunks: [] });
  return {
    object: Promise.resolve(object),
    warnings: Promise.resolve(undefined as any),
    usage: Promise.resolve(undefined as any),
    providerMetadata: Promise.resolve(undefined as any),
    request: Promise.resolve(undefined as any),
    response: Promise.resolve(undefined as any),
    finishReason: Promise.resolve('stop' as any),
    partialObjectStream: emptyStream as any,
    elementStream: emptyStream as any,
    textStream: emptyStream as any,
    fullStream: emptyStream as any,
    pipeTextStreamToResponse() { },
    toTextStreamResponse() {
      return new Response(JSON.stringify(object), {
        headers: { 'Content-Type': 'application/json' },
      });
    },
  } as StreamObjectResult<T, T, any>;
}
