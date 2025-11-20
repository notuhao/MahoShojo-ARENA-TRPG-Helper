// lib/config.ts

// AI 提供商配置接口
export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string | string[]; // 支持单个模型或多个模型数组
  type: 'openai' | 'google';
  retryCount?: number;
  skipProbability?: number;
  mode?: 'json' | 'auto' | 'tool' | undefined;
  weight?: number; // 负载均衡权重，数值越大被选中概率越高
}

export interface OfficialModelOption {
  id: string;
  label: string;
  provider?: string;
}

export type GmTwoStageMode = 'disabled' | 'same-session' | 'separate-model';

// 解析 AI 提供商配置的函数
const parseAIProviders = (): AIProvider[] => {
  // JSON 配置方式
  if (process.env.AI_PROVIDERS_CONFIG) {
    try {
      const providers = JSON.parse(process.env.AI_PROVIDERS_CONFIG) as AIProvider[];
      return providers
        .filter(p => p.apiKey && p.baseUrl && p.model && p.type)
        .map(p => ({
          ...p,
          retryCount: p.retryCount ?? 1,
          skipProbability: p.skipProbability ?? 0
        }));
    } catch (error) {
      console.warn('解析 AI_PROVIDERS_CONFIG 失败，回退到简单配置:', error);
    }
  }

  // 向后兼容：单个 API Key 方式
  const singleKey = process.env.AI_API_KEY;
  const singleUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const singleModel = process.env.AI_MODEL || 'gemini-2.5-flash-lite';

  if (singleKey) {
    return [{
      name: 'default_provider',
      apiKey: singleKey,
      baseUrl: singleUrl,
      model: singleModel,
      type: singleUrl.includes('googleapis.com') ? 'google' : 'openai',
      retryCount: 1,
      skipProbability: 0
    }];
  }

  return [];
};

// 获取有效的 API 提供商（按配置顺序）
const getAPIProviders = (): AIProvider[] => {
  return parseAIProviders();
};

// 为了保持向后兼容，转换为原有的格式
const parseApiPairs = () => {
  const providers = getAPIProviders();
  return providers.map(provider => ({
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    name: provider.name,
    model: provider.model,
    mode: provider?.mode || 'auto'
  }));
};

// 获取第一个提供商的模型
const getDefaultModel = (): string | string[] => {
  const providers = getAPIProviders();
  if (providers.length > 0) {
    return providers[0].model;
  }
  return 'gemini-2.5-flash';
};

const getStage1DefaultModel = () => {
  return process.env.GM_STAGE1_DEFAULT_MODEL || 'gemini-2.5-flash';
};

const getStage2DefaultModel = () => {
  return process.env.GM_STAGE2_DEFAULT_MODEL || 'gemini-2.5-flash-lite';
};

// 获取负载均衡策略
const getLoadBalanceStrategy = (): string => {
  return process.env.AI_LOAD_BALANCE_STRATEGY || 'random';
};

const getGmTwoStageMode = (): GmTwoStageMode => {
  const raw = (process.env.GM_TURN_TWO_STAGE_MODE || 'separate-model').toLowerCase();
  if (raw === 'disabled' || raw === 'none') return 'disabled';
  if (raw === 'separate-model' || raw === 'separate') return 'separate-model';
  return 'same-session';
};

const parseFormatterPriority = (): string[] => {
  const raw = process.env.GM_TURN_FORMATTING_MODEL_PRIORITY;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch (error) {
    // fallthrough to CSV parsing
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};


const parseOfficialModels = (): OfficialModelOption[] => {
  const raw = process.env.AI_OFFICIAL_MODELS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OfficialModelOption[];
    return parsed.filter((item) => item?.id && item?.label);
  } catch (error) {
    console.warn('解析 AI_OFFICIAL_MODELS 失败:', error);
    return [];
  }
};

export const config = {
  // Vercel AI 配置
  API_PAIRS: parseApiPairs(),
  MODEL: getDefaultModel(),
  PROVIDERS: getAPIProviders(),
  LOAD_BALANCE_STRATEGY: getLoadBalanceStrategy(),
  OFFICIAL_MODELS: parseOfficialModels(),
  GM_TURN_TWO_STAGE_MODE: getGmTwoStageMode(),
  GM_TURN_FORMATTING_MODEL_PRIORITY: parseFormatterPriority(),
  GM_STAGE1_DEFAULT_MODEL: getStage1DefaultModel(),
  GM_STAGE2_DEFAULT_MODEL: getStage2DefaultModel(),

  // 数据卡管理配置
  DEFAULT_DATA_CARD_CAPACITY: 20,
}
