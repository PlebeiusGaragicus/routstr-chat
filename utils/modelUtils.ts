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


// Determine required minimum sats to run a request for a model
export const getRequiredSatsForModel = (model: Model, apiMessages?: any[]): number => {
  try {
    const approximateTokens = apiMessages ? Math.ceil(JSON.stringify(apiMessages, null, 2).length / 2.84) : 10000; // Assumed tokens for minimum balance calculation
    const sp: any = model?.sats_pricing as any;
    
    if (!sp) return 0;
    
    // If we don't have max_completion_cost, fall back to max_cost
    if (!sp.max_completion_cost) {
      return sp.max_cost ?? 50;
    }
    
    // Calculate based on token usage (similar to getTokenAmountForModel in apiUtils.ts)
    const promptCosts = (sp.prompt || 0) * approximateTokens;
    const totalEstimatedCosts = promptCosts + sp.max_completion_cost;
    return totalEstimatedCosts * 1.05; // Added a 5% margin
  } catch (e) {
    console.error(e);
    return 0;
  }
};

// Check if a model is available based on balance
export const isModelAvailable = (model: Model, balance: number) => {
  try {
    const required = getRequiredSatsForModel(model);
    if (!required || required <= 0) return true;
    return balance >= required;
  }
  catch(error){ 
    console.log(model);
    console.error(error);
    return true;
  }
};
