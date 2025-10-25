// components/arena/StoryLog.tsx

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { StoryLogEntry } from '@/lib/types/arena';

interface StoryLogProps {
  entries: StoryLogEntry[];
}

const entryStyles: Record<StoryLogEntry['type'], string> = {
  'gm-narrative': 'bg-white/90 border border-purple-200 text-slate-800',
  'gm-prompt': 'bg-purple-50 border border-purple-200 text-purple-700',
  player: 'bg-slate-900 text-white border border-slate-700',
  'state-update': 'bg-emerald-50 border border-emerald-200 text-emerald-700',
  'level-up': 'bg-amber-50 border border-amber-200 text-amber-700',
};

const StoryLog: React.FC<StoryLogProps> = ({ entries }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <section className="flex-1 rounded-2xl border border-purple-200 bg-white/70 p-4 shadow-sm backdrop-blur">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">叙事日志</h2>
      <div
        ref={containerRef}
        className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700"
      >
        {entries.length === 0 ? (
          <div className="rounded-xl bg-purple-50 p-6 text-center text-sm text-purple-500">
            尚无日志，请输入指令或导入历史记录开始你的冒险。
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className={`rounded-xl p-4 shadow-sm ${entryStyles[entry.type]} transition`}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    {entry.role === 'gm' ? 'GM' : '玩家'} ·{' '}
                    {entry.type === 'gm-narrative'
                      ? '叙事'
                      : entry.type === 'gm-prompt'
                        ? '提问'
                        : entry.type === 'player'
                          ? '输入'
                          : entry.type === 'level-up'
                            ? '成长提示'
                            : '状态更新'}
                  </span>
                  <span className="text-slate-500">{entry.timestamp}</span>
                </div>
                <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:mb-2 prose-strong:text-purple-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {entry.content}
                  </ReactMarkdown>
                </div>

                {entry.stateUpdates && entry.stateUpdates.length > 0 && (
                  <div className="mt-3 rounded-lg bg-emerald-100/70 p-3 text-xs text-emerald-900">
                    <p className="font-semibold">状态变更</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {entry.stateUpdates.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.manualResults && entry.manualResults.length > 0 && (
                  <div className="mt-3 rounded-lg bg-slate-800/80 p-3 text-xs text-slate-100">
                    <p className="font-semibold text-white">手动判定参考</p>
                    <ul className="mt-1 space-y-1">
                      {entry.manualResults.map((result) => (
                        <li key={result.adjudicationId}>
                          [{result.successLevel}] {result.actorCodename} · {result.actionSummary} → 骰点{' '}
                          {result.roll} / {result.threshold}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.levelUpData && entry.levelUpData.length > 0 && (
                  <div className="mt-3 rounded-lg bg-amber-100/70 p-3 text-xs text-amber-900">
                    <p className="font-semibold">成长建议</p>
                    <ul className="mt-1 space-y-1">
                      {entry.levelUpData.map((levelUp) => (
                        <li key={levelUp.characterId}>
                          <strong>{levelUp.characterId}</strong> · {levelUp.narration || '等待玩家分配点数'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default StoryLog;
