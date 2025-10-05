export function parseModelKey(key: string): { id: string; base: string | null } {
  const separatorIndex = key.indexOf('@@');
  if (separatorIndex === -1) {
    return { id: key, base: null };
  }
  return { id: key.slice(0, separatorIndex), base: key.slice(separatorIndex + 2) };
}

export function normalizeBaseUrl(base?: string | null): string | null {
  if (!base || typeof base !== 'string' || base.length === 0) return null;
  const withProto = base.startsWith('http') ? base : `https://${base}`;
  return withProto.endsWith('/') ? withProto : `${withProto}/`;
}

// Provider models cache helpers shared across app
// Kept here to avoid duplicating localStorage logic in components
import type { Model } from '@/data/models';
import { getStorageItem, setStorageItem } from '@/utils/storageUtils';

export function upsertCachedProviderModels(baseUrl: string, models: Model[]): void {
  try {
    const normalized = normalizeBaseUrl(baseUrl);
    if (!normalized) return;
    const existing = getStorageItem<Record<string, Model[]>>('modelsFromAllProviders', {} as any);
    setStorageItem('modelsFromAllProviders', { ...existing, [normalized]: models });
  } catch {}
}

export function getCachedProviderModels(baseUrl: string): Model[] | undefined {
  try {
    const normalized = normalizeBaseUrl(baseUrl);
    if (!normalized) return undefined;
    const all = getStorageItem<Record<string, Model[]>>('modelsFromAllProviders', {} as any);
    return all[normalized];
  } catch {
    return undefined;
  }
}
