// components/DiceRoller.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Dices, Award, ShieldAlert, Edit3 } from 'lucide-react';

/**
 * @fileoverview 魔法少女竞技场TRPG在线骰子组件
 * @description
 * 实现了TRPG所需的核心投骰功能，并深度整合了《魔法少女竞技场》的d100判定规则。
 * - [V1.2] 新增：允许用户为每次投掷添加可选的目的说明，并记录在历史中。
 * - [V1.1] 新增：支持一次性投掷多个骰子并计算总和。
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
  numberOfDice: number; // 新增：记录投掷的骰子数量
  result: number; // 对于多骰，这里是总和
  breakdown: string; // 记录d100构成或多骰的各次结果
  successLevel: SuccessLevel;
  targetValue: number | null;
  isBonus: boolean;
  isPenalty: boolean;
  reason: string; // 新增：投掷目的
}

// --- 核心组件 ---
const DiceRoller: React.FC = () => {
  // --- 状态管理 ---
  const [diceType, setDiceType] = useState<DiceType>('d100');
  const [numberOfDice, setNumberOfDice] = useState<number>(1);
  const [targetValue, setTargetValue] = useState<number>(50);
  const [isBonus, setIsBonus] = useState(false);
  const [isPenalty, setIsPenalty] = useState(false);
  const [rollReason, setRollReason] = useState<string>(''); // 新增：投掷目的输入状态
  const [lastRoll, setLastRoll] = useState<RollHistoryEntry | null>(null);
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);

  /**
   * 计算d100投掷结果的成功等级
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
    
    // d100 逻辑保持独立，不支持复数投掷
    if (diceType === 'd100') {
      const unitsDie = Math.floor(Math.random() * 10);
      let tensDie1 = Math.floor(Math.random() * 10);
      let finalTensDie = tensDie1;

      if (isBonus || isPenalty) {
        const tensDie2 = Math.floor(Math.random() * 10);
        if (isBonus) {
          finalTensDie = Math.min(tensDie1, tensDie2);
          breakdown = `十位[${tensDie1*10}, ${tensDie2*10}]→${finalTensDie*10} + 个位[${unitsDie}]`;
        } else {
          finalTensDie = Math.max(tensDie1, tensDie2);
          breakdown = `十位[${tensDie1*10}, ${tensDie2*10}]→${finalTensDie*10} + 个位[${unitsDie}]`;
        }
      } else {
        breakdown = `十位[${finalTensDie*10}] + 个位[${unitsDie}]`;
      }
      
      result = (finalTensDie * 10) + unitsDie;
      if (result === 0) result = 100;
      
      successLevel = calculateSuccessLevel(result, targetValue);

    } else {
      const max = parseInt(diceType.slice(1), 10);
      const rolls: number[] = [];
      let sum = 0;
      for (let i = 0; i < numberOfDice; i++) {
        const roll = Math.floor(Math.random() * max) + 1;
        rolls.push(roll);
        sum += roll;
      }
      result = sum;
      breakdown = numberOfDice > 1 ? `[${rolls.join(', ')}]` : `掷骰 D${max}`;
    }

    const newRoll: RollHistoryEntry = {
      id: Date.now(),
      diceType,
      numberOfDice: diceType === 'd100' ? 1 : numberOfDice,
      result,
      breakdown,
      successLevel,
      targetValue: diceType === 'd100' ? targetValue : null,
      isBonus,
      isPenalty,
      reason: rollReason.trim(), // 新增：保存投掷目的
    };

    setLastRoll(newRoll);
    setHistory(prev => [newRoll, ...prev.slice(0, 9)]);
    setRollReason(''); // 优化体验：投掷后清空目的输入框

  }, [diceType, numberOfDice, targetValue, isBonus, isPenalty, rollReason]);

  // 当骰子类型改变时，重置
  useEffect(() => {
    if (diceType !== 'd100') {
      setIsBonus(false);
      setIsPenalty(false);
    } else {
      setNumberOfDice(1);
    }
  }, [diceType]);
  
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="grid md:grid-cols-2 gap-6">
        {/* --- 控制面板 --- */}
        <div className="space-y-4">
          <div className="flex items-end gap-2">
              <div className="flex-grow">
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
              <div className="flex-shrink-0">
                <label htmlFor="number-of-dice" className="input-label">数量</label>
                <input
                  id="number-of-dice"
                  type="number"
                  value={numberOfDice}
                  onChange={(e) => setNumberOfDice(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="input-field w-20 text-center"
                  min="1"
                  disabled={diceType === 'd100'}
                />
              </div>
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

          {/* 新增：投掷目的输入框 */}
          <div>
            <label htmlFor="roll-reason" className="input-label">投掷目的 (可选)</label>
            <input
              id="roll-reason"
              type="text"
              value={rollReason}
              onChange={(e) => setRollReason(e.target.value)}
              className="input-field"
              placeholder="例如：攻击检定、调查线索..."
            />
          </div>

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
                {lastRoll.numberOfDice > 1 && <div className="text-sm text-gray-500">总和</div>}
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
            <ul className="space-y-2 text-sm text-gray-700">
              {history.map(roll => (
                <li key={roll.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between">
                    <div>
                      {roll.isBonus && <Award size={12} className="inline mr-1 text-yellow-500" />}
                      {roll.isPenalty && <ShieldAlert size={12} className="inline mr-1 text-red-500" />}
                      {roll.numberOfDice > 1 ? `${roll.numberOfDice}${roll.diceType.toUpperCase()}` : roll.diceType.toUpperCase()}
                      : <span className="font-bold text-lg">{roll.result}</span>
                      {roll.targetValue !== null && ` vs ${roll.targetValue}%`}
                      {roll.numberOfDice > 1 && <span className="text-gray-500 ml-2">{roll.breakdown}</span>}
                    </div>
                    <span className="font-semibold">{roll.successLevel}</span>
                  </div>
                  {/* 新增：显示投掷目的 */}
                  {roll.reason && (
                    <div className="text-xs text-gray-500 italic mt-1 pl-1 flex items-center gap-1">
                      <Edit3 size={12}/>
                      <span>{roll.reason}</span>
                    </div>
                  )}
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