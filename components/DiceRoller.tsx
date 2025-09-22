// components/DiceRoller.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Dices, Award, ShieldAlert } from 'lucide-react';

/**
 * @fileoverview 魔法少女竞技场TRPG在线骰子组件
 * @description
 * 实现了TRPG所需的核心投骰功能，并深度整合了《魔法少女竞技场》的d100判定规则。
 * - 支持多种常用骰子 (d100, d20, d12, d10, d8, d6, d4)。
 * - 针对d100系统，实现了奖励骰与惩罚骰机制。
 * - 能够根据用户输入的成功率，自动判定d100投掷结果的成功等级（大成功、极限成功等）。
 * - 包含清晰的投掷历史记录。
 */

// --- 类型定义 ---
type DiceType = 'd100' | 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4';
type SuccessLevel = '大成功' | '极限成功' | '困难成功' | '成功' | '失败' | '大失败' | '—';

interface RollHistoryEntry {
  id: number;
  diceType: DiceType;
  result: number;
  breakdown: string; // 用于记录d100的构成，如 "70 (十位) + 5 (个位)"
  successLevel: SuccessLevel;
  targetValue: number | null;
  isBonus: boolean;
  isPenalty: boolean;
}

// --- 核心组件 ---
const DiceRoller: React.FC = () => {
  // --- 状态管理 ---
  const [diceType, setDiceType] = useState<DiceType>('d100');
  const [targetValue, setTargetValue] = useState<number>(50); // 目标成功率
  const [isBonus, setIsBonus] = useState(false); // 是否为奖励骰
  const [isPenalty, setIsPenalty] = useState(false); // 是否为惩罚骰
  const [lastRoll, setLastRoll] = useState<RollHistoryEntry | null>(null);
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);

  /**
   * 计算d100投掷结果的成功等级
   * @param roll - 投掷的点数 (1-100)
   * @param target - 目标成功率
   * @returns {SuccessLevel} 成功等级的字符串
   */
  const calculateSuccessLevel = (roll: number, target: number): SuccessLevel => {
    if (roll === 1) return '大成功';
    if (roll === 100) return '大失败';
    if (roll > target) return '失败';
    if (roll <= target / 5) return '极限成功';
    if (roll <= target / 2) return '困难成功';
    return '成功';
  };

  /**
   * 核心掷骰逻辑
   */
  const handleRoll = useCallback(() => {
    let result: number;
    let breakdown = '';
    let successLevel: SuccessLevel = '—';

    // 根据骰子类型执行不同的投掷逻辑
    switch (diceType) {
      case 'd100':
        const unitsDie = Math.floor(Math.random() * 10);
        let tensDie1 = Math.floor(Math.random() * 10);
        let finalTensDie = tensDie1;

        if (isBonus || isPenalty) {
          const tensDie2 = Math.floor(Math.random() * 10);
          if (isBonus) { // 奖励骰：取较小的十位数
            finalTensDie = Math.min(tensDie1, tensDie2);
            breakdown = `十位[${tensDie1*10}, ${tensDie2*10}]→${finalTensDie*10} + 个位[${unitsDie}]`;
          } else { // 惩罚骰：取较大的十位数
            finalTensDie = Math.max(tensDie1, tensDie2);
            breakdown = `十位[${tensDie1*10}, ${tensDie2*10}]→${finalTensDie*10} + 个位[${unitsDie}]`;
          }
        } else {
          breakdown = `十位[${finalTensDie*10}] + 个位[${unitsDie}]`;
        }
        
        result = (finalTensDie * 10) + unitsDie;
        if (result === 0) result = 100; // 规则：00等于100
        
        successLevel = calculateSuccessLevel(result, targetValue);
        break;

      default:
        const max = parseInt(diceType.slice(1), 10);
        result = Math.floor(Math.random() * max) + 1;
        breakdown = `掷骰 D${max}`;
    }

    const newRoll: RollHistoryEntry = {
      id: Date.now(),
      diceType,
      result,
      breakdown,
      successLevel,
      targetValue: diceType === 'd100' ? targetValue : null,
      isBonus,
      isPenalty,
    };

    setLastRoll(newRoll);
    setHistory(prev => [newRoll, ...prev.slice(0, 9)]); // 保留最近10条记录

  }, [diceType, targetValue, isBonus, isPenalty]);

  // 当骰子类型改变时，重置奖励/惩罚状态
  useEffect(() => {
    if (diceType !== 'd100') {
      setIsBonus(false);
      setIsPenalty(false);
    }
  }, [diceType]);
  
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="grid md:grid-cols-2 gap-6">
        {/* --- 控制面板 --- */}
        <div className="space-y-4">
          <div>
            <label htmlFor="dice-type-select" className="input-label">选择骰子</label>
            <select
              id="dice-type-select"
              value={diceType}
              onChange={(e) => setDiceType(e.target.value as DiceType)}
              className="input-field"
            >
              <option value="d100">d100 (核心判定)</option>
              <option value="d20">d20</option>
              <option value="d12">d12</option>
              <option value="d10">d10</option>
              <option value="d8">d8</option>
              <option value="d6">d6</option>
              <option value="d4">d4</option>
            </select>
          </div>
          
          {diceType === 'd100' && (
            <>
              <div>
                <label htmlFor="target-value" className="input-label">目标成功率 (%)</label>
                <input
                  id="target-value"
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 0)}
                  className="input-field"
                  min="1"
                  max="100"
                />
              </div>
              <div className="flex space-x-4">
                {/* 修正 #1：为label添加htmlFor，为input添加id */}
                <label htmlFor="bonus-checkbox" className="flex items-center space-x-2 cursor-pointer">
                  <input id="bonus-checkbox" type="checkbox" checked={isBonus} onChange={() => { setIsBonus(!isBonus); setIsPenalty(false); }} className="h-4 w-4 rounded" />
                  <span>奖励骰</span>
                </label>
                <label htmlFor="penalty-checkbox" className="flex items-center space-x-2 cursor-pointer">
                  <input id="penalty-checkbox" type="checkbox" checked={isPenalty} onChange={() => { setIsPenalty(!isPenalty); setIsBonus(false); }} className="h-4 w-4 rounded" />
                  <span>惩罚骰</span>
                </label>
              </div>
            </>
          )}

          <button
            onClick={handleRoll}
            className="w-full generate-button flex items-center justify-center gap-2"
          >
            <Dices size={20} />
            开始投掷
          </button>
        </div>

        {/* --- 结果展示与历史记录 --- */}
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4 text-center h-48 flex flex-col justify-center items-center">
            {lastRoll ? (
              <>
                <div className="text-6xl font-bold text-purple-700">{lastRoll.result}</div>
                {lastRoll.diceType === 'd100' && (
                    <div className={`mt-2 px-3 py-1 text-lg font-semibold rounded-full text-white ${
                        {
                            '大成功': 'bg-yellow-500', '极限成功': 'bg-green-600', '困难成功': 'bg-green-500',
                            '成功': 'bg-blue-500', '失败': 'bg-gray-500', '大失败': 'bg-red-600',
                            '—': 'bg-gray-400'
                        }[lastRoll.successLevel]
                    }`}>
                        {lastRoll.successLevel}
                    </div>
                )}
                <div className="text-sm text-gray-500 mt-1">{lastRoll.breakdown}</div>
              </>
            ) : (
              <div className="text-gray-500">等待你的第一次投掷...</div>
            )}
          </div>
          
          <div>
            <h4 className="input-label">投掷历史</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {history.map(roll => (
                <li key={roll.id} className="flex justify-between p-2 bg-gray-50 rounded">
                  <div>
                    {roll.isBonus && <Award size={12} className="inline mr-1 text-yellow-500" />}
                    {roll.isPenalty && <ShieldAlert size={12} className="inline mr-1 text-red-500" />}
                    {roll.diceType.toUpperCase()}: <span className="font-bold">{roll.result}</span>
                    {roll.targetValue !== null && ` vs ${roll.targetValue}%`}
                  </div>
                  <span className="font-semibold">{roll.successLevel}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceRoller;