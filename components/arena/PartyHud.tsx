// components/arena/PartyHud.tsx

import React from 'react';
import type { SessionCharacter } from '@/lib/types/arena';

interface PartyHudProps {
  characters: SessionCharacter[];
}

const StatusBadge: React.FC<{ label: string }> = ({ label }) => (
  <span className="mr-1 mb-1 rounded-full bg-fuchsia-200 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
    {label}
  </span>
);

const StatBar: React.FC<{ title: string; current: number; max: number; colorClass: string }> = ({
  title,
  current,
  max,
  colorClass,
}) => {
  const percent = Math.min(100, Math.max(0, Math.round((current / Math.max(max, 1)) * 100)));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{title}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${percent}%`, transition: 'width 0.3s ease' }}
        />
      </div>
    </div>
  );
};

const PartyHud: React.FC<PartyHudProps> = ({ characters }) => {
  if (characters.length === 0) {
    return (
      <aside className="rounded-2xl border border-purple-200 bg-white/70 p-6 shadow-sm backdrop-blur">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">队伍总览</h2>
        <p className="text-sm text-slate-500">
          当前会话中没有已加载的角色。请导入角色卡或通过角色创建器生成后导入。
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-purple-200 bg-white/80 p-4 shadow-sm backdrop-blur lg:max-h-[calc(100vh-3rem)] lg:w-80 lg:overflow-y-auto">
      <h2 className="text-lg font-semibold text-slate-800">队伍总览</h2>
      {characters.map((character) => {
        const { sheet, runtime } = character;
        return (
          <div key={character.characterId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700">{sheet.info.codename || '未命名'}</p>
                <p className="text-xs text-slate-500">{sheet.info.realName || '身份待补全'}</p>
              </div>
              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-600">
                {sheet.info.faction || '未阵营'}
              </span>
            </div>

            <div className="mt-3">
              <StatBar title="HP" current={runtime.hp.current} max={runtime.hp.max} colorClass="bg-rose-400" />
              <StatBar title="MP" current={runtime.mp.current} max={runtime.mp.max} colorClass="bg-sky-400" />
              <StatBar
                title="光辉"
                current={runtime.radiance.current}
                max={runtime.radiance.max}
                colorClass="bg-amber-400"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>阴影值</span>
                <span>{runtime.shadowPoints}</span>
              </div>
            </div>

            {runtime.statuses.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-600">状态效果</p>
                <div className="mt-1 flex flex-wrap">
                  {runtime.statuses.map((status) => (
                    <StatusBadge key={status} label={status} />
                  ))}
                </div>
              </div>
            )}

            {sheet.bonds.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-600">羁绊摘要</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-500">
                  {sheet.bonds.slice(0, 2).map((bond) => (
                    <li key={bond.id}>
                      <span className="font-medium text-slate-600">{bond.target}</span> · {bond.description}
                    </li>
                  ))}
                  {sheet.bonds.length > 2 && <li>……</li>}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};

export default PartyHud;
