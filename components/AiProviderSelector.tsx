import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { AI_PROVIDER_CATALOG, type AIProviderOption } from '@/lib/ai/constants';
import Link from 'next/link';

export interface UserAIProviderConfig {
  providerId: string;
  apiKey: string;
  modelId?: string;
  stage1ModelId?: string;
  stage2ModelId?: string;
}

interface AiProviderSelectorProps {
  onConfigChange: (config: UserAIProviderConfig | null) => void;
  mode?: 'single' | 'dual';
  defaultStageModels?: {
    stage1?: string;
    stage2?: string;
  };
}

const STORAGE_SELECTED_PROVIDER = 'arena.customProvider.selected';
const STORAGE_API_KEY_PREFIX = 'arena.customProvider.apiKey.';
const STORAGE_STAGE1_MODEL_PREFIX = 'arena.customProvider.stage1Model.';
const STORAGE_STAGE2_MODEL_PREFIX = 'arena.customProvider.stage2Model.';

const getApiKeyStorageKey = (providerId: string) => `${STORAGE_API_KEY_PREFIX}${providerId}`;
const getStage1ModelStorageKey = (providerId: string) => `${STORAGE_STAGE1_MODEL_PREFIX}${providerId}`;
const getStage2ModelStorageKey = (providerId: string) => `${STORAGE_STAGE2_MODEL_PREFIX}${providerId}`;

interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  controlId?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder, disabled = false, controlId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value) ?? null;

  const handleDocumentClick = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;
    if (!containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [handleDocumentClick, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen]);

  const renderSelected = () => (
    <div className="flex flex-col text-left leading-tight">
      <span className="text-sm font-semibold text-gray-800">
        {selectedOption?.label ?? placeholder}
      </span>
      <span className="text-xs text-gray-500">
        {selectedOption?.description ?? '请选择'}
      </span>
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`input-field flex w-full items-center justify-between gap-2 text-left ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id={controlId}
        disabled={disabled}
      >
        {renderSelected()}
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-pink-200 bg-white shadow-lg">
          <div role="listbox">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors ${option.value === value ? 'bg-pink-100 text-pink-700' : 'hover:bg-pink-50'}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="text-sm font-semibold text-gray-800">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs text-gray-500">
                    {option.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const resolveDefaultModel = (provider: AIProviderOption | null, preferred?: string) => {
  if (!provider) return '';
  if (preferred && provider.models.some(model => model.value === preferred)) {
    return preferred;
  }
  return provider.models[0]?.value || '';
};

const AiProviderSelector: React.FC<AiProviderSelectorProps> = ({ onConfigChange, mode = 'single', defaultStageModels }) => {
  const providerOptions = useMemo<AIProviderOption[]>(() => AI_PROVIDER_CATALOG, []);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('system');
  const [selectedStage1Model, setSelectedStage1Model] = useState<string>('');
  const [selectedStage2Model, setSelectedStage2Model] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const providerSelectId = useId();
  const stage1SelectId = useId();
  const stage2SelectId = useId();
  const apiKeyInputId = useId();
  const latestConfigRef = useRef<UserAIProviderConfig | null>(null);
  const onConfigChangeRef = useRef(onConfigChange);
  const stage1DefaultModel = defaultStageModels?.stage1;
  const stage2DefaultModel = defaultStageModels?.stage2;

  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
    if (!isHydrated) {
      return;
    }
    onConfigChangeRef.current(latestConfigRef.current);
  }, [isHydrated, onConfigChange]);

  const activeProvider = providerOptions.find(provider => provider.id === selectedProviderId) ?? null;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const savedProviderId = window.localStorage.getItem(STORAGE_SELECTED_PROVIDER) || 'system';
    const validProvider = providerOptions.find(item => item.id === savedProviderId) ?? providerOptions[0] ?? null;
    if (!validProvider) {
      setSelectedProviderId('system');
    } else {
      setSelectedProviderId(validProvider.id);
    }
    if (!savedProviderId) {
      window.localStorage.setItem(STORAGE_SELECTED_PROVIDER, validProvider?.id ?? 'system');
    }
    setIsHydrated(true);
  }, [providerOptions]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') {
      return;
    }

    if (!activeProvider) {
      setApiKey('');
      setSelectedStage1Model('');
      setSelectedStage2Model('');
      latestConfigRef.current = null;
      onConfigChangeRef.current(null);
      return;
    }

    window.localStorage.setItem(STORAGE_SELECTED_PROVIDER, activeProvider.id);

    const storedApiKey = window.localStorage.getItem(getApiKeyStorageKey(activeProvider.id)) || '';
    const storedStage1 = window.localStorage.getItem(getStage1ModelStorageKey(activeProvider.id));
    const storedStage2 = window.localStorage.getItem(getStage2ModelStorageKey(activeProvider.id));

    const fallbackStage1 = resolveDefaultModel(activeProvider, stage1DefaultModel);
    const fallbackStage2Candidate = resolveDefaultModel(activeProvider, stage2DefaultModel) || fallbackStage1;

    setApiKey(storedApiKey);
    setSelectedStage1Model(storedStage1 || fallbackStage1);
    if (mode === 'dual') {
      setSelectedStage2Model(storedStage2 || fallbackStage2Candidate || fallbackStage1);
    } else {
      setSelectedStage2Model('');
    }
  }, [activeProvider, stage1DefaultModel, stage2DefaultModel, isHydrated, mode]);

  useEffect(() => {
    if (!isHydrated || !activeProvider) {
      return;
    }
    const effectiveStage1 = selectedStage1Model || resolveDefaultModel(activeProvider, stage1DefaultModel);
    const effectiveStage2 = mode === 'dual'
      ? (selectedStage2Model || stage2DefaultModel || effectiveStage1)
      : undefined;

    const nextConfig: UserAIProviderConfig = {
      providerId: activeProvider.id,
      modelId: effectiveStage1,
      stage1ModelId: effectiveStage1,
      stage2ModelId: effectiveStage2,
      apiKey: apiKey.trim(),
    };
    latestConfigRef.current = nextConfig;
    onConfigChangeRef.current(nextConfig);
  }, [activeProvider, apiKey, isHydrated, mode, selectedStage1Model, selectedStage2Model, stage1DefaultModel, stage2DefaultModel]);

  useEffect(() => {
    if (!isHydrated || !activeProvider || typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(getApiKeyStorageKey(activeProvider.id), apiKey);
  }, [activeProvider, apiKey, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !activeProvider || typeof window === 'undefined') {
      return;
    }
    if (!selectedStage1Model) {
      return;
    }
    window.localStorage.setItem(getStage1ModelStorageKey(activeProvider.id), selectedStage1Model);
  }, [activeProvider, isHydrated, selectedStage1Model]);

  useEffect(() => {
    if (mode !== 'dual') return;
    if (!isHydrated || !activeProvider || typeof window === 'undefined') {
      return;
    }
    if (!selectedStage2Model) {
      return;
    }
    window.localStorage.setItem(getStage2ModelStorageKey(activeProvider.id), selectedStage2Model);
  }, [activeProvider, isHydrated, mode, selectedStage2Model]);

  const providerSelectOptions = useMemo<CustomSelectOption[]>(() => {
    return providerOptions.map((provider): CustomSelectOption => ({
      value: provider.id,
      label: provider.name,
      description: provider.description,
    }));
  }, [providerOptions]);

  const modelSelectOptions: CustomSelectOption[] = useMemo(() => {
    if (!activeProvider) return [];
    return activeProvider.models.map(model => ({
      value: model.value,
      label: model.label,
      description: model.description,
    }));
  }, [activeProvider]);

  const stageSelectionBlock = (
    <div className="mt-3 space-y-3 rounded-lg border border-pink-200 bg-pink-50 p-3 text-sm text-gray-700">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={stage1SelectId}>
          {mode === 'dual' ? '步骤 1 · 叙事草稿模型' : '选择模型'}
        </label>
        <CustomSelect
          options={modelSelectOptions}
          value={selectedStage1Model}
          onChange={setSelectedStage1Model}
          placeholder="选择模型"
          controlId={stage1SelectId}
          disabled={modelSelectOptions.length === 0}
        />
      </div>
      {mode === 'dual' && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={stage2SelectId}>
            步骤 2 · 结构化输出模型
          </label>
          <CustomSelect
            options={modelSelectOptions}
            value={selectedStage2Model || selectedStage1Model}
            onChange={setSelectedStage2Model}
            placeholder="选择模型"
            controlId={stage2SelectId}
            disabled={modelSelectOptions.length === 0}
          />
          <p className="mt-1 text-xs text-gray-500">
            第二步负责解析并输出 Delta JSON，可选择更敏捷的轻量模型。
          </p>
        </div>
      )}

      {activeProvider && activeProvider.id !== 'system' && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={apiKeyInputId}>API Key</label>
          <input
            id={apiKeyInputId}
            className="input-field"
            placeholder="请输入该供应商的 API Key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            API Key 仅存储于本地浏览器 localStorage，不会上传到服务器。
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="input-group">
      <label className="input-label" htmlFor={providerSelectId}>自定义 AI 能力提供商 (可选)</label>
      <CustomSelect
        options={providerSelectOptions}
        value={selectedProviderId}
        onChange={setSelectedProviderId}
        placeholder="选择供应商"
        controlId={providerSelectId}
      />
      <p className="text-xs text-gray-500">
        {mode === 'dual'
          ? '可针对 GM 两阶段分别挑选模型，下面可选“系统默认策略”或自带 API Key。'
          : '更多提供商正在添加中...'}
      </p>
      {activeProvider && activeProvider.id !== 'system' && (
        <div className="mt-4">
          <Link
            href={activeProvider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-pink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
          >
            前往获取 API Key
          </Link>
        </div>
      )}

      {stageSelectionBlock}
    </div>
  );
};

export default AiProviderSelector;
