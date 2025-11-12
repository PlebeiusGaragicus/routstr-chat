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
import { recommendedModels } from '@/lib/recommendedModels';
import { getStorageItem, loadLastUsedModel, setStorageItem } from '@/utils/storageUtils';

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
    const totalEstimatedCosts = (promptCosts + sp.max_completion_cost) * 1.05;
    return totalEstimatedCosts > sp.max_cost ? sp.max_cost : totalEstimatedCosts; // in come image input calculations, this cost balloons up. Gotta figure out how to calculate image tokens. 
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

export const modelSelectionStrategy = async (models: Model[], maxBalance: number, pendingCashuAmountState: number): Promise<Model | null> => {
  let modelToSelect: Model | null = null;
  const lastUsedModelId = loadLastUsedModel();
  if (!modelToSelect) {
    if (lastUsedModelId && lastUsedModelId.includes('@@')) {
      const { id, base } = parseModelKey(lastUsedModelId);
      const fixedBase = normalizeBaseUrl(base);
      if (!fixedBase) return null;
      const normalized = fixedBase.endsWith('/') ? fixedBase : `${fixedBase}/`;
      const allByProvider = getStorageItem<Record<string, Model[]>>('modelsFromAllProviders', {} as any);
      const list = allByProvider?.[normalized] || allByProvider?.[lastUsedModelId] || [];
      modelToSelect = Array.isArray(list) ? (list.find((m: Model) => m.id === id) ?? null) : null;
      if (!modelToSelect) {
        const res = await fetch(`${normalized}v1/models`);
        if (res.ok) {
          const json = await res.json();
          const providerList: Model[] = Array.isArray(json?.data) ? json.data.map((m: Model) => ({
            ...m,
            id: m.id.split('/').pop() || m.id
          })) : [];
          const transformedId = id.split('/').pop() || id;
          const found = providerList.find((m: Model) => m.id === transformedId) ?? null;
          if (found) {
            // cache to storage for future
            upsertCachedProviderModels(normalized, providerList);
            modelToSelect = found;
          }
        }
      }
    }
    else if (lastUsedModelId) {
      modelToSelect = models.find((m: Model) => m.id === lastUsedModelId) ?? null;
    }
  }

  if (!modelToSelect) {
    const recommended = models.filter((m: Model) => recommendedModels.includes(m.id))
      .sort((a, b) => recommendedModels.indexOf(a.id) - recommendedModels.indexOf(b.id));
    const compatible = recommended.filter((m: Model) => isModelAvailable(m, maxBalance + pendingCashuAmountState));
   if (compatible.length > 0) modelToSelect = compatible[0];
  }

  if (!modelToSelect) {
    const compatible = models.filter((m: Model) => isModelAvailable(m, maxBalance + pendingCashuAmountState))
    .sort((a, b) => {
      const aMaxCost = getRequiredSatsForModel(a);
      const bMaxCost = getRequiredSatsForModel(b);
      return bMaxCost - aMaxCost; // Descending order
    });
    console.log("rdlogs: compatible", compatible.slice(5));
    if (compatible.length > 0) modelToSelect = compatible[0];
  }
  
  return modelToSelect;
}
