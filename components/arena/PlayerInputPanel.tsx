// components/arena/PlayerInputPanel.tsx

import React, { useMemo, useState } from 'react';
import { Send, Trash2, PlusCircle, Swords } from 'lucide-react';
import type {
  ManualAdjudicationResult,
  SessionCharacter,
} from '@/lib/types/arena';
import { MANUAL_SUCCESS_LEVELS } from '@/lib/schemas/gmTurnSchemas';
import { generateId } from '@/lib/utils/id';

interface PlayerInputPanelProps {
  characters: SessionCharacter[];
  manualResults: ManualAdjudicationResult[];
  currentInput: string;
  onInputChange: (value: string) => void;
  onAddManualResult: (result: ManualAdjudicationResult) => void;
  onRemoveManualResult: (adjudicationId: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isProcessing: boolean;
  lastPrompt?: string | null;
}

interface ManualFormState {
  actorId: string;
  targetId: string;
  actionSummary: string;
  skillOrAttribute: string;
  roll: number;
  threshold: number;
  successLevel: ManualAdjudicationResult['successLevel'];
  effectNarration: string;
}

const INITIAL_FORM_STATE: ManualFormState = {
  actorId: '',
  targetId: '',
  actionSummary: '',
  skillOrAttribute: '',
  roll: 50,
  threshold: 50,
  successLevel: 'SUCCESS',
  effectNarration: '',
};

const PlayerInputPanel: React.FC<PlayerInputPanelProps> = ({
  characters,
  manualResults,
  currentInput,
  onInputChange,
  onAddManualResult,
  onRemoveManualResult,
  onSubmit,
  disabled,
  isProcessing,
  lastPrompt,
}) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [formState, setFormState] = useState<ManualFormState>(INITIAL_FORM_STATE);

  const canSubmit = useMemo(
    () => !!currentInput.trim() || manualResults.length > 0,
    [currentInput, manualResults.length],
  );

  const handleSubmitManual = () => {
    if (!formState.actorId || !formState.actionSummary || !formState.skillOrAttribute) {
      return;
    }
    const actor = characters.find((char) => char.characterId === formState.actorId);
    if (!actor) return;

    const result: ManualAdjudicationResult = {
      adjudicationId: generateId(),
      actorId: actor.characterId,
      actorCodename: actor.sheet.info.codename || actor.sheet.info.realName || actor.characterId,
      targetId: formState.targetId || undefined,
      actionSummary: formState.actionSummary,
      skillOrAttribute: formState.skillOrAttribute,
      roll: formState.roll,
      threshold: formState.threshold,
      successLevel: formState.successLevel,
      effectNarration: formState.effectNarration || undefined,
    };
    onAddManualResult(result);
    setFormState(INITIAL_FORM_STATE);
    setShowManualForm(false);
  };

  return (
    <section className="rounded-2xl border border-purple-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">玩家引导区</h2>
        <button
          type="button"
          onClick={() => setShowManualForm((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-purple-300 px-3 py-1 text-sm text-purple-700 transition hover:bg-purple-100"
        >
          <Swords size={16} />
          🎲 添加判定
        </button>
      </div>

      {lastPrompt && (
        <div className="mb-3 rounded-xl bg-purple-50 p-3 text-sm text-purple-700">
          <p className="font-semibold text-purple-800">GM 的提问</p>
          <p className="mt-1 whitespace-pre-line leading-6">{lastPrompt}</p>
        </div>
      )}

      <textarea
        className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
        placeholder="描述你的角色要做什么，或回应 GM 的提问……"
        value={currentInput}
        onChange={(event) => onInputChange(event.target.value)}
        disabled={disabled || isProcessing}
      />

      {manualResults.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="mb-2 font-semibold text-slate-800">已附加的手动判定</p>
          <ul className="space-y-2">
            {manualResults.map((result) => (
              <li key={result.adjudicationId} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">
                    {result.actorCodename} · {result.actionSummary}
                  </p>
                  <p className="text-xs text-slate-500">
                    {result.skillOrAttribute} | 骰点 {result.roll}/{result.threshold} ·{' '}
                    {result.successLevel}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  onClick={() => onRemoveManualResult(result.adjudicationId)}
                  aria-label="移除判定"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showManualForm && (
        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-sm text-slate-700">
          <p className="mb-2 font-semibold text-purple-800">填写手动判定结果</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              执行动作的角色
              <select
                className="mt-1 w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.actorId}
                onChange={(event) => setFormState((prev) => ({ ...prev, actorId: event.target.value }))}
              >
                <option value="">选择角色</option>
                {characters.map((character) => (
                  <option key={character.characterId} value={character.characterId}>
                    {character.sheet.info.codename || character.sheet.info.realName || character.characterId}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              目标角色（可选）
              <select
                className="mt-1 w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.targetId}
                onChange={(event) => setFormState((prev) => ({ ...prev, targetId: event.target.value }))}
              >
                <option value="">无</option>
                {characters.map((character) => (
                  <option key={character.characterId} value={character.characterId}>
                    {character.sheet.info.codename || character.sheet.info.realName || character.characterId}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2 text-xs font-semibold text-slate-600">
              行动摘要
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.actionSummary}
                onChange={(event) => setFormState((prev) => ({ ...prev, actionSummary: event.target.value }))}
                placeholder="例如：使用奇境『流光庭苑』束缚敌人"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              判定依据（技能/属性）
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.skillOrAttribute}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, skillOrAttribute: event.target.value }))
                }
                placeholder="如：channel、意志(Will)"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              骰点结果
              <input
                type="number"
                min={1}
                max={100}
                className="mt-1 w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.roll}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, roll: Number(event.target.value) }))
                }
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              成功阈值
              <input
                type="number"
                min={1}
                max={100}
                className="mt-1 w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.threshold}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, threshold: Number(event.target.value) }))
                }
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              成功等级
              <select
                className="mt-1 w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.successLevel}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    successLevel: event.target.value as ManualAdjudicationResult['successLevel'],
                  }))
                }
              >
                {MANUAL_SUCCESS_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2 text-xs font-semibold text-slate-600">
              叙述建议（可选）
              <textarea
                className="mt-1 h-20 w-full resize-none rounded-lg border border-purple-200 bg-white p-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={formState.effectNarration}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, effectNarration: event.target.value }))
                }
                placeholder="描述你希望 GM 如何整合这次判定到叙事中"
              />
            </label>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                setShowManualForm(false);
                setFormState(INITIAL_FORM_STATE);
              }}
            >
              取消
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
              onClick={handleSubmitManual}
              disabled={!formState.actorId || !formState.actionSummary || !formState.skillOrAttribute}
            >
              <PlusCircle size={16} />
              添加判定
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:opacity-60"
          onClick={onSubmit}
          disabled={disabled || isProcessing || !canSubmit}
        >
          <Send size={16} />
          {isProcessing ? '处理中…' : '继续'}
        </button>
      </div>
    </section>
  );
};

export default PlayerInputPanel;
