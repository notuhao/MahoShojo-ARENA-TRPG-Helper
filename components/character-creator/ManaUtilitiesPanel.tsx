// components/character-creator/ManaUtilitiesPanel.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Power, DynamicStat, CharacterAttributes, SkillPoints } from '@/pages/character/create';
import { EffectTag, ModifierTag } from '@/lib/trpg/powers';
import { SKILLS } from '@/lib/trpg/skills';
import { calcMaxMp, calcPowerMpCost, calcFocusRecovery } from '@/lib/trpg/mp';
import { Droplets, Gauge, RefreshCw } from 'lucide-react';

interface ManaUtilitiesPanelProps {
  powers: Power[];
  effectTags: EffectTag[];
  modifierTags: ModifierTag[];
  mp: DynamicStat;
  onMpChange: (newStat: DynamicStat) => void;
  attributes: CharacterAttributes;
  skills: SkillPoints;
}

type PowerCalcState = Record<number, { outputRank: number; activeModifierIds: string[] }>;

const ManaUtilitiesPanel: React.FC<ManaUtilitiesPanelProps> = ({
  powers,
  effectTags,
  modifierTags,
  mp,
  onMpChange,
  attributes,
  skills,
}) => {
  const [calcState, setCalcState] = useState<PowerCalcState>({});
  const [focusMethod, setFocusMethod] = useState<'channel' | 'mag'>('channel');
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [lastRecovery, setLastRecovery] = useState<number | null>(null);

  // 同步能力列表到本地状态（变频输出默认使用满功率）
  useEffect(() => {
    setCalcState((prev) => {
      const next: PowerCalcState = {};
      powers.forEach((p) => {
        const effect = effectTags.find((e) => e.id === p.effectTagId);
        const maxRank = effect?.isScalable ? p.rank : 1;
        const prevState = prev[p.id];
        next[p.id] = {
          outputRank: Math.min(maxRank, prevState?.outputRank ?? maxRank),
          activeModifierIds: prevState?.activeModifierIds ?? [...p.modifierTagIds],
        };
      });
      return next;
    });
  }, [powers, effectTags]);

  // 计算 Channel 技能值与 MAGx5%
  const channelSkill = SKILLS.find((s) => s.id === 'channel');
  const channelBase = channelSkill ? channelSkill.base(attributes) : 0;
  const channelInvest = skills['channel'] ?? 0;
  const channelTarget = channelBase + channelInvest;
  const magTarget = attributes.MAG * 5;
  const successTarget = focusMethod === 'channel' ? channelTarget : magTarget;

  // 处理 MP 变动
  const spendMp = (cost: number) => {
    const remaining = Math.max(0, mp.current - cost);
    onMpChange({ ...mp, current: remaining });
  };

  const gainMp = (gain: number) => {
    const capped = Math.min(mp.max, mp.current + gain);
    onMpChange({ ...mp, current: capped });
  };

  const handleRoll = (manual?: number) => {
    const roll = manual ?? Math.ceil(Math.random() * 100);
    setRollResult(roll);
    const isSuccess = roll <= successTarget;
    const recovered = calcFocusRecovery(attributes.MAG, isSuccess);
    setLastRecovery(recovered);
  };

  const currentMaxMp = useMemo(() => calcMaxMp(attributes.MAG), [attributes.MAG]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-5">
      <div className="flex items-center gap-3">
        <Droplets className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-xl font-bold text-gray-800">魔力管理工具箱</h3>
          <p className="text-sm text-gray-600">基于规则书 MP 规则，提供变频输出与魔力汇聚辅助计算功能。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
          <p className="text-sm font-semibold text-blue-800">当前MP</p>
          <p className="text-2xl font-bold text-blue-900">{mp.current} / {mp.max}</p>
          <p className="text-xs text-blue-700 mt-1">理论上限（随属性自动更新）：{currentMaxMp} MP</p>
        </div>
        <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
          <p className="text-sm font-semibold text-purple-800">公式速查</p>
          <p className="text-xs text-purple-700 leading-relaxed">
            消耗 = 当前使用的效果阶数 + ceil(激活修正PCP/3)；<br />
            魔力汇聚：主要动作，技能或 MAG×5 判定；成功回复 ceil(MAG/10)+1 MP，失败 1 MP。
          </p>
        </div>
      </div>

      {/* 魔力消耗计算器 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-indigo-600" />
          <p className="font-semibold text-gray-800">魔力消耗计算器 · 变频输出</p>
        </div>

        {powers.length === 0 && (
          <p className="text-sm text-gray-500">尚未创建能力，创建后可在此计算消耗。</p>
        )}

        <div className="space-y-4">
          {powers.map((p) => {
            const effect = effectTags.find((e) => e.id === p.effectTagId);
            const state = calcState[p.id];
            if (!effect || !state) return null;

            const maxRank = effect.isScalable ? p.rank : 1;
            const outputId = `output-${p.id}`;
            const currentCost = calcPowerMpCost(p, effectTags, modifierTags, {
              outputRank: state.outputRank,
              activeModifierIds: state.activeModifierIds,
            });
            const fullCost = calcPowerMpCost(p, effectTags, modifierTags);
            const lowCost = calcPowerMpCost(p, effectTags, modifierTags, {
              outputRank: effect.isScalable ? 1 : p.rank,
              activeModifierIds: [],
            });

            const toggleModifier = (id: string) => {
              setCalcState((prev) => {
                const current = prev[p.id] ?? { outputRank: maxRank, activeModifierIds: [] };
                const active = current.activeModifierIds.includes(id)
                  ? current.activeModifierIds.filter((m) => m !== id)
                  : [...current.activeModifierIds, id];
                return { ...prev, [p.id]: { ...current, activeModifierIds: active } };
              });
            };

            return (
              <div key={p.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{p.name || '未命名能力'}</p>
                    <p className="text-xs text-gray-500">基础阶数上限：{maxRank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">本次消耗</p>
                    <p className="text-xl font-bold text-indigo-700">{currentCost} MP</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700" htmlFor={outputId}>输出阶数</label>
                  <input
                    id={outputId}
                    type="range"
                    min={1}
                    max={maxRank}
                    value={state.outputRank}
                    onChange={(e) =>
                      setCalcState((prev) => {
                        const existing = prev[p.id] ?? { outputRank: maxRank, activeModifierIds: [...p.modifierTagIds] };
                        return {
                          ...prev,
                          [p.id]: { ...existing, outputRank: parseInt(e.target.value, 10) || 1 },
                        };
                      })
                    }
                    className="flex-1"
                    disabled={maxRank === 1}
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxRank}
                    value={state.outputRank}
                    onChange={(e) =>
                      setCalcState((prev) => {
                        const existing = prev[p.id] ?? { outputRank: maxRank, activeModifierIds: [...p.modifierTagIds] };
                        return {
                          ...prev,
                          [p.id]: {
                            ...existing,
                            outputRank: Math.max(1, Math.min(maxRank, parseInt(e.target.value, 10) || 1)),
                          },
                        };
                      })
                    }
                    className="input-field !p-1 w-20 text-center"
                    disabled={maxRank === 1}
                  />
                </div>

                {p.modifierTagIds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">启用的修正（可取消以节流）：</p>
                    <div className="flex flex-wrap gap-2">
                      {p.modifierTagIds.map((id) => {
                        const mod = modifierTags.find((m) => m.id === id);
                        if (!mod) return null;
                        const checked = state.activeModifierIds.includes(id);
                        return (
                          <label
                            key={id}
                            className={`px-2 py-1 rounded border text-xs cursor-pointer ${checked ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-300'}`}
                          >
                            <input
                              type="checkbox"
                              className="mr-1"
                              checked={checked}
                              onChange={() => toggleModifier(id)}
                            />
                            {mod.name} (+{mod.cost} PCP)
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>满功率：{fullCost} MP</span>
                  <span>仅核心效果：{lowCost} MP</span>
                  <span>公式：阶数 + ceil(修正PCP/3)</span>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => spendMp(currentCost)}
                    className="generate-button !py-2 !text-sm !mb-0"
                  >
                    扣除本次消耗
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 魔力汇聚判定处理器 */}
      <div className="space-y-3 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-600" />
          <p className="font-semibold text-gray-800">魔力汇聚判定处理器</p>
        </div>
        <p className="text-sm text-gray-600">
          主要动作：进行一次 {focusMethod === 'channel' ? '魔力放出 (Channel)' : 'MAG × 5%'} 判定。成功回复 ceil(MAG/10)+1 MP，失败回复 1 MP。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded border bg-gray-50">
            <p className="font-semibold text-gray-700">判定方式</p>
            <div className="mt-2 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={focusMethod === 'channel'}
                  onChange={() => setFocusMethod('channel')}
                />
                <span>魔力放出 技能 ({channelTarget}%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={focusMethod === 'mag'}
                  onChange={() => setFocusMethod('mag')}
                />
                <span>MAG × 5% ({magTarget}%)</span>
              </label>
            </div>
          </div>

          <div className="p-3 rounded border bg-gray-50 space-y-2">
            <p className="font-semibold text-gray-700">判定 & 结果</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRoll()}
                className="generate-button !py-2 !text-sm !mb-0"
              >
                掷 d100
              </button>
              <input
                type="number"
                placeholder="手动输入结果"
                className="input-field !p-1 text-center w-28"
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) handleRoll(val);
                }}
              />
            </div>
            <p className="text-xs text-gray-600">
              目标值 {successTarget}% · 最近掷点：{rollResult ?? '—'}
            </p>
            <p className="text-sm font-semibold text-emerald-700">
              回复量：{lastRecovery ?? 0} MP
            </p>
          </div>

          <div className="p-3 rounded border bg-gray-50 space-y-2">
            <p className="font-semibold text-gray-700">应用到角色</p>
            <p className="text-xs text-gray-500">成功/失败都会至少回复1点，请在判定后点击应用。</p>
            <button
              onClick={() => lastRecovery && gainMp(lastRecovery)}
              disabled={!lastRecovery}
              className="generate-button !py-2 !text-sm !mb-0 disabled:bg-gray-400"
            >
              应用 MP 回复
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManaUtilitiesPanel;
