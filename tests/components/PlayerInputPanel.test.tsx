import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlayerInputPanel from '@/components/arena/PlayerInputPanel';
import { buildSessionCharacter, buildManualResult } from '@/tests/utils/sessionFactory';

const characters = [buildSessionCharacter('pc-1')];

const baseProps = () => ({
  characters,
  manualResults: [] as ReturnType<typeof buildManualResult>[],
  currentInput: '',
  onInputChange: vi.fn(),
  onAddManualResult: vi.fn(),
  onRemoveManualResult: vi.fn(),
  onSubmit: vi.fn(),
  disabled: false,
  isProcessing: false,
  lastPrompt: null,
} as const);

describe('PlayerInputPanel', () => {
  it('当暂停原因为 MANUAL_ADJUDICATION 时自动展开判定表单', async () => {
    const props = { ...baseProps(), pauseReason: 'MANUAL_ADJUDICATION' as const };
    render(<PlayerInputPanel {...props} />);
    await waitFor(() => expect(screen.getByText('填写手动判定结果')).toBeInTheDocument());
  });

  it('当暂停原因为 PLAYER_CHOICE 时展示快速选项', () => {
    const props = { ...baseProps(), pauseReason: 'PLAYER_CHOICE' as const };
    render(<PlayerInputPanel {...props} />);
    const quickGroup = screen.getByTestId('quick-choice-group');
    expect(quickGroup).toBeInTheDocument();
    expect(quickGroup.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('处理 OOC 输入时会回调 onInputChange', () => {
    const onInputChange = vi.fn();
    const props = { ...baseProps(), onInputChange, pauseReason: 'PLAYER_INPUT' as const };
    render(<PlayerInputPanel {...props} />);
    const textarea = screen.getByPlaceholderText('描述你的角色要做什么，或回应 GM 的提问……');
    fireEvent.change(textarea, { target: { value: '((我要炸掉竞技场))' } });
    expect(onInputChange).toHaveBeenLastCalledWith('((我要炸掉竞技场))');
  });
});
