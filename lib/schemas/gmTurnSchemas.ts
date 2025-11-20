// lib/schemas/gmTurnSchemas.ts

import { z } from 'zod';
import {
  characterSheetSchema,
  customPowerTagSchema,
  customSkillSchema,
  dynamicStatSchema,
} from './characterSheetSchema';

/**
 * @fileoverview 定义 GM 轮次 API 的请求与响应 Zod Schema。
 * @description
 * - 所有与 AI 交互的输入输出都必须通过 Schema 验证，以确保规则保真。
 * - 该模块同时被前端与后端复用，统一类型来源。
 */

const manualSuccessLevelEnum = z.enum([
  'CRITICAL_SUCCESS',
  'EXTREME_SUCCESS',
  'HARD_SUCCESS',
  'SUCCESS',
  'PARTIAL_SUCCESS',
  'FAILURE',
  'FUMBLE',
]);

export type ManualSuccessLevel = z.infer<typeof manualSuccessLevelEnum>;

export const manualAdjudicationResultSchema = z.object({
  adjudicationId: z.string().min(1).describe('前端生成的唯一ID，用于去重'),
  actorId: z.string().min(1).describe('执行该行动的角色ID'),
  actorCodename: z.string().min(1).describe('执行行动的角色代号或称谓'),
  targetId: z.string().optional().describe('该行动影响的对象ID'),
  actionSummary: z.string().min(1).describe('行为描述（例：投射煌焰矢）'),
  skillOrAttribute: z.string().min(1).describe('本次判定基于的技能或属性'),
  roll: z.number().int().min(1).max(100).describe('d100 骰点'),
  threshold: z.number().int().min(1).max(100).describe('成功阈值'),
  successLevel: manualSuccessLevelEnum.describe(
    '根据规则书第3章定义的成功等级',
  ),
  effectNarration: z
    .string()
    .optional()
    .describe('玩家对结果的叙述建议，可为空'),
});

export const conversationEntrySchema = z.object({
  role: z.enum(['gm', 'user']).describe('历史记录中的说话者身份'),
  content: z.string().describe('具体的对话内容'),
});

const partialDynamicStatSchema = dynamicStatSchema
  .partial()
  .refine((value) => value.current !== undefined || value.max !== undefined, {
    message: '需至少提供 current 或 max 字段',
  });

const stageModelPreferenceSchema = z.object({
  draft: z.string().optional().describe('第一阶段（叙事草稿）的模型偏好'),
  formatter: z.string().optional().describe('第二阶段（结构化输出）的模型偏好'),
});

const providerConfigSchema = z.object({
  providerId: z.string(),
  modelId: z.string().optional(),
  stage1ModelId: z.string().optional(),
  stage2ModelId: z.string().optional(),
  apiKey: z.string().optional(),
});

export const stateDeltaEntrySchema = z
  .object({
    characterId: z.string().describe('需要更新的角色ID'),
    hpDelta: z.number().optional().describe('HP 的增量（负值代表损失）'),
    hpOverride: partialDynamicStatSchema.optional().describe('若需直接覆盖 HP current/max，可在此指定'),
    mpDelta: z.number().optional().describe('MP 的增量'),
    mpOverride: partialDynamicStatSchema.optional().describe('若需直接覆盖 MP current/max，可在此指定'),
    radianceDelta: z.number().optional().describe('光辉的增量'),
    radianceOverride: partialDynamicStatSchema.optional().describe('若需直接覆盖光辉 current/max，可在此指定'),
    shadowPointsDelta: z.number().optional().describe('阴影值的增量'),
    shadowPointsOverride: z.number().optional().describe('若需直接覆盖阴影值，可在此指定'),
    statusesGained: z.array(z.string()).optional(),
    statusesRemoved: z.array(z.string()).optional(),
    bondsChanged: z
      .array(
        z.object({
          bondId: z.number(),
          statusAndNotes: z.string().optional(),
          radianceImpact: z.number().optional(),
          description: z.string().optional(),
        }),
      )
      .optional(),
    narrativeNote: z
      .string()
      .optional()
      .describe('该条状态更新的叙事解释，便于日志展示'),
  })
  .describe('AI 返回的角色状态增量更新');

export const levelUpRecommendationSchema = z.object({
  characterId: z.string().describe('触发成长的角色ID'),
  suggestedAttributeSpends: z
    .array(
      z.object({
        attributeId: z.string().describe('属性标识'),
        spend: z.number().describe('建议投入的点数'),
      }),
    )
    .optional()
    .describe('建议的属性加点'),
  suggestedSkillSpends: z
    .array(
      z.object({
        skillId: z.string().describe('技能标识'),
        spend: z.number().describe('建议投入的点数'),
      }),
    )
    .optional()
    .describe('建议的技能加点'),
  suggestedPowers: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        cost: z.number(),
      }),
    )
    .optional(),
  narration: z
    .string()
    .optional()
    .describe('关于成长契机的叙述提示，供前端展示'),
});

export const gmTurnResponseSchema = z.object({
  narrative_chunk: z
    .string()
    .describe('AI 生成的故事段落，需遵守关键节点模型'),
  state_updates: z
    .array(stateDeltaEntrySchema)
    .describe('角色状态的增量更新')
    .default([]),
  pause_at_node: z
    .boolean()
    .describe('是否暂停等待玩家输入（关键节点模型核心）')
    .default(false),
  pause_reason: z
    .enum([
      'KEY_NODE',
      'LEVEL_UP',
      'EPILOGUE_SUGGESTION',
      'SCENARIO_DIRECTIVE',
      'MANUAL_ADJUDICATION',
      'PLAYER_CHOICE',
      'PLAYER_INPUT',
    ])
    .describe('暂停原因，用于前端决定UI响应')
    .default('SCENARIO_DIRECTIVE'),
  gm_prompt_to_user: z
    .string()
    .describe('AI 面向玩家的提问或指引')
    .default(''),
  level_up_data: z
    .array(levelUpRecommendationSchema)
    .describe('成长数据（第7章），可能为空')
    .default([]),
});

export type GmTurnResponse = z.infer<typeof gmTurnResponseSchema>;
export type ManualAdjudicationResult = z.infer<typeof manualAdjudicationResultSchema>;
export type ConversationEntry = z.infer<typeof conversationEntrySchema>;
export type StateDeltaEntry = z.infer<typeof stateDeltaEntrySchema>;
export type LevelUpRecommendation = z.infer<typeof levelUpRecommendationSchema>;
export type SessionCharacter = z.infer<typeof sessionCharacterSchema>;
export type ScenarioData = z.infer<typeof scenarioDataSchema>;
export type CustomDefinitions = z.infer<typeof customDefinitionSchema>;

export const MANUAL_SUCCESS_LEVELS = manualSuccessLevelEnum.options;

export const scenarioDataSchema = z
  .object({
    id: z.string().describe('模组ID'),
    title: z.string().describe('模组标题'),
    description: z.string().describe('简要概述'),
    currentNodeId: z.string().optional(),
    nodes: z
      .array(
        z.object({
          nodeId: z.string(),
          summary: z.string(),
          gmTips: z.string().optional(),
        }),
      )
      .optional(),
  })
  .partial()
  .describe('可选的模组 JSON');

export const customDefinitionSchema = z.object({
  customSkills: z.array(customSkillSchema).optional(),
  customPowerTags: z.array(customPowerTagSchema).optional(),
});

export const sessionCharacterSchema = z.object({
  characterId: z
    .string()
    .min(1)
    .describe('会话中的角色唯一ID，应在全局唯一'),
  sheet: characterSheetSchema.describe('完整的角色卡数据'),
  runtime: z
    .object({
      hp: dynamicStatSchema.describe('当前HP状态'),
      mp: dynamicStatSchema.describe('当前MP状态'),
      radiance: dynamicStatSchema.describe('当前光辉状态'),
      shadowPoints: z.number().min(0).describe('当前阴影值'),
      statuses: z.array(z.string()).describe('当前状态效果列表'),
    })
    .describe('该角色在会话中的动态数值'),
  customDefinitions: customDefinitionSchema.optional(),
});

export const gmTurnRequestSchema = z.object({
  full_character_sheets: z
    .array(sessionCharacterSchema)
    .min(1)
    .describe('所有参与者的完整角色数据'),
  conversation_history: z
    .array(conversationEntrySchema)
    .describe('截至目前的完整对话日志'),
  compressed_history_summary: z
    .string()
    .optional()
    .describe('较旧历史的AI摘要，用于节省上下文'),
  current_user_input: z
    .string()
    .nullable()
    .describe('当前玩家在输入框中的文本'),
  manual_adjudication_results: z
    .array(manualAdjudicationResultSchema)
    .optional()
    .describe('玩家自主进行的手动判定结果'),
  scenario_data: scenarioDataSchema.optional(),
  custom_definitions: customDefinitionSchema
    .optional()
    .describe('全局自定义技能/标签定义'),
  model_preference: z
    .string()
    .optional()
    .describe('用户选择的模型 ID，仅限后端已配置的模型'),
  stage_model_preferences: stageModelPreferenceSchema
    .optional()
    .describe('GM 两阶段分别使用的官方模型偏好'),
  provider_config: providerConfigSchema
    .optional()
    .describe('用户自定义的 AI 提供商配置'),
  stage_provider_configs: z
    .object({
      draft: providerConfigSchema.optional(),
      formatter: providerConfigSchema.optional(),
    })
    .optional()
    .describe('GM 两阶段独立的自定义提供商配置'),
});

export type GmTurnRequest = z.infer<typeof gmTurnRequestSchema>;
export type ProviderConfigInput = z.infer<typeof providerConfigSchema>;
