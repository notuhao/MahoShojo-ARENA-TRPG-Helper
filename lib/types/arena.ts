// lib/types/arena.ts

import type {
  ConversationEntry,
  LevelUpRecommendation,
  ManualAdjudicationResult,
  ScenarioData,
  SessionCharacter,
  StateDeltaEntry,
  CustomDefinitions,
} from '@/lib/schemas/gmTurnSchemas';

export type { ConversationEntry, LevelUpRecommendation, ManualAdjudicationResult, ScenarioData, SessionCharacter, StateDeltaEntry, CustomDefinitions };

export interface StoryLogEntry {
  id: string;
  role: 'gm' | 'user';
  type: 'gm-narrative' | 'gm-prompt' | 'player' | 'state-update' | 'level-up';
  content: string;
  timestamp: string;
  manualResults?: ManualAdjudicationResult[];
  stateUpdates?: string[];
  pauseReason?: string;
  levelUpData?: LevelUpRecommendation[];
}
