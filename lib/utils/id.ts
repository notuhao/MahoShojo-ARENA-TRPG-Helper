// lib/utils/id.ts

/**
 * @fileoverview 简单的 ID 生成工具。
 * @description 统一处理浏览器和 Edge Runtime 的 UUID 生成，若不支持则回退到时间戳 + 随机数。
 */

export const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};
