import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StoryLog from '@/components/arena/StoryLog';
import type { StoryLogEntry } from '@/lib/types/arena';

const buildEntry = (partial: Partial<StoryLogEntry>): StoryLogEntry => ({
  id: partial.id || 'log-1',
  role: partial.role || 'gm',
  type: partial.type || 'gm-narrative',
  content: partial.content || '内容',
  timestamp: partial.timestamp || new Date().toISOString(),
  manualResults: partial.manualResults,
  stateUpdates: partial.stateUpdates,
  pauseReason: partial.pauseReason,
  levelUpData: partial.levelUpData,
});

describe('StoryLog', () => {
  it('渲染 Markdown 叙事内容', () => {
    const entries = [buildEntry({ content: '**粗体** 与 *斜体* 测试' })];
    const { container } = render(<StoryLog entries={entries} />);
    expect(container.querySelector('strong')).toHaveTextContent('粗体');
    expect(container.querySelector('em')).toHaveTextContent('斜体');
  });

  it('显示玩家输入类型的日志', () => {
    const entries = [
      buildEntry({ id: 'gm', role: 'gm', type: 'gm-narrative', content: 'GM 叙事' }),
      buildEntry({ id: 'player', role: 'user', type: 'player', content: '玩家输入' }),
    ];
    render(<StoryLog entries={entries} />);
    expect(screen.getByText('GM · 叙事')).toBeInTheDocument();
    expect(screen.getByText('玩家 · 输入')).toBeInTheDocument();
    expect(screen.getByText('玩家输入')).toBeInTheDocument();
  });
});
