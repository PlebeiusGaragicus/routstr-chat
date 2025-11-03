import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Model } from '@/data/models';
import { DEFAULT_MINT_URL } from '@/lib/utils';
import { loadMintUrl, saveMintUrl, loadBaseUrl, saveBaseUrl, loadLastUsedModel, saveLastUsedModel, loadBaseUrlsList, saveBaseUrlsList, migrateCurrentCashuToken, loadModelProviderMap, saveModelProviderMap, setStorageItem, getStorageItem } from '@/utils/storageUtils';
import {parseModelKey, normalizeBaseUrl, upsertCachedProviderModels } from '@/utils/modelUtils';

export interface UseApiStateReturn {
  models: Model[];
  selectedModel: Model | null;
  isLoadingModels: boolean;
  baseUrl: string;
  setModels: (models: Model[]) => void;
  setSelectedModel: (model: Model | null) => void;
  setIsLoadingModels: (loading: boolean) => void;
  setBaseUrl: (url: string) => void;
  fetchModels: (balance: number) => Promise<void>; // Modified to accept balance
  handleModelChange: (modelId: string, configuredKeyOverride?: string) => void;
}

/**
 * Custom hook for managing API configuration and model state
 * Handles API endpoint configuration, model fetching and caching,
 * model selection state, and API error handling
 */
export const useApiState = (isAuthenticated: boolean, balance: number): UseApiStateReturn => {
  const searchParams = useSearchParams();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [baseUrl, setBaseUrlState] = useState('');
  const [baseUrlsList, setBaseUrlsList] = useState<string[]>([]);
  // Removed unused currentBaseUrlIndex state

  // Initialize URLs from storage
  useEffect(() => {
    if (isAuthenticated) {
      const loadedBaseUrls = loadBaseUrlsList();
      setBaseUrlsList(loadedBaseUrls);

      const currentBaseUrl = loadBaseUrl('');
      setBaseUrlState(currentBaseUrl);
    }
  }, [isAuthenticated]);

  // Helper: normalize a provider base URL
  const normalizeBase = useCallback((url: string | undefined | null): string | null => {
    if (!url || typeof url !== 'string' || url.length === 0) return null;
    const withProto = url.startsWith('http') ? url : `https://${url}`;
    return withProto.endsWith('/') ? withProto : `${withProto}/`;
  }, []);

  // Bootstrap provider bases from the directory when none are configured
  const bootstrapProviders = useCallback(async (): Promise<string[]> => {
    try {
      setIsLoadingModels(true);
      const res = await fetch('https://api.routstr.com/v1/providers/');
      if (!res.ok) throw new Error(`Failed providers ${res.status}`);
      const data = await res.json();
      const providers = Array.isArray(data?.providers) ? data.providers : [];
      const bases = new Set<string>();
      for (const p of providers) {
        const primary = normalizeBase(p?.endpoint_url);
        if (primary && !primary.startsWith('http://')) bases.add(primary);
        const alts: string[] = Array.isArray(p?.endpoint_urls) ? p.endpoint_urls : [];
        for (const alt of alts) {
          const n = normalizeBase(alt);
          if (n && !n.startsWith('http://')) bases.add(n);
        }
      }
      const list = Array.from(bases);
      if (list.length > 0) {
        saveBaseUrlsList(list);
        setBaseUrlsList(list);
      }
      return list;
    } catch (e) {
      console.error('Failed to bootstrap providers', e);
      return [];
    } finally {
      setIsLoadingModels(false);
    }
  }, [normalizeBase]);

  // Migrate old cashu token format on load
  useEffect(() => {
    if (baseUrl) {
      migrateCurrentCashuToken(baseUrl);
    }
  }, [baseUrl]);

  // Fetch available models from API and handle URL model selection
  const fetchModels = useCallback(async (currentBalance: number) => {
    try {
      setIsLoadingModels(true);
      let bases = baseUrlsList;
      if (!bases || bases.length === 0) {
        bases = await bootstrapProviders();
        if (!bases || bases.length === 0) {
          setModels([]);
          setSelectedModel(null);
          return;
        }
      }

      const results = await Promise.allSettled(
        bases.map(async (url) => {
          const base = url.endsWith('/') ? url : `${url}/`;
          const res = await fetch(`${base}v1/models`);
          if (!res.ok) throw new Error(`Failed ${res.status}`);
          const json = await res.json();
          const list: Model[] = Array.isArray(json?.data) ? json.data : [];
          return { base, list };
        })
      );

      // Save all provider results to localStorage for later use
      try {
        const modelsFromAllProviders: Record<string, Model[]> = {};
        for (const r of results) {
          if (r.status === 'fulfilled') {
            const { base, list } = r.value;
            modelsFromAllProviders[base] = list;
          }
        }
        setStorageItem('modelsFromAllProviders', modelsFromAllProviders);
      } catch {}

      // Build best-priced model per id across providers and remember provider
      const bestById = new Map<string, { model: Model; base: string }>();

      function estimateMinCost(m: Model): number {
        return m?.sats_pricing?.completion ?? 0;
      }

      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const { base, list } = r.value;
        for (const m of list) {
          const existing = bestById.get(m.id);
          if (!existing) {
            bestById.set(m.id, { model: m, base });
            continue;
          }
          const currentCost = estimateMinCost(m);
          const existingCost = estimateMinCost(existing.model);
          if (currentCost < existingCost) {
            bestById.set(m.id, { model: m, base });
          }
        }
      }

      const combinedModels = Array.from(bestById.values()).map(v => v.model);
      setModels(combinedModels);

      // Persist provider mapping for best-priced winners
      const newMap = loadModelProviderMap();
      let changed = false;
      for (const [id, entry] of bestById.entries()) {
        if (newMap[id] !== entry.base) {
          newMap[id] = entry.base;
          changed = true;
        }
      }
      if (changed) saveModelProviderMap(newMap);

      // Select model based on URL param or last used
      let modelToSelect: Model | null = null;
      const urlModelId = searchParams.get('model');
      if (urlModelId) {
        modelToSelect = combinedModels.find((m: Model) => m.id === urlModelId) || null;
      }
      const lastUsedModelId = loadLastUsedModel();
      if (!modelToSelect) {
        if (lastUsedModelId && lastUsedModelId.includes('@@')) {
          const { id } = parseModelKey(lastUsedModelId);
          const fixedBaseRaw = parseModelKey(lastUsedModelId).base;
          const fixedBase = normalizeBaseUrl(fixedBaseRaw);
          if (!fixedBase) return;
          const normalized = fixedBase.endsWith('/') ? fixedBase : `${fixedBase}/`;
          const allByProvider = getStorageItem<Record<string, Model[]>>('modelsFromAllProviders', {} as any);
          const list = allByProvider?.[normalized] || allByProvider?.[lastUsedModelId] || [];
          modelToSelect = Array.isArray(list) ? (list.find((m: Model) => m.id === id) ?? null) : null;
        }
        else if (lastUsedModelId) {
          modelToSelect = combinedModels.find((m: Model) => m.id === lastUsedModelId) ?? null;
        }
      }
      if (!modelToSelect) {
        // If last used was provider-specific but not found in cache, fetch it on-demand
        if (lastUsedModelId && lastUsedModelId.includes('@@')) {
          try {
            const { id, base } = parseModelKey(lastUsedModelId);
            const fixedBase = normalizeBaseUrl(base);
            if (fixedBase) {
              const normalized = fixedBase.endsWith('/') ? fixedBase : `${fixedBase}/`;
              const res = await fetch(`${normalized}v1/models`);
              if (res.ok) {
                const json = await res.json();
                const providerList: Model[] = Array.isArray(json?.data) ? json.data : [];
                const found = providerList.find((m: Model) => m.id === id) ?? null;
                if (found) {
                  // cache to storage for future
                  upsertCachedProviderModels(normalized, providerList);
                  modelToSelect = found;
                }
              }
            }
          } catch {}
        }
      }

      if (!modelToSelect) {
        const compatible = combinedModels.filter((m: Model) => {
          try {
            const sp: any = m.sats_pricing as any;
            if (!sp) return false;
            const required = Math.max(
              Number(sp.max_cost) || 0,
              Number(sp.max_completion_cost) || 0
            );
            return required > 0 && currentBalance >= required;
          } catch {
            return false;
          }
        });
        if (compatible.length > 0) modelToSelect = compatible[0];
      }
      setSelectedModel(modelToSelect);
      if (modelToSelect && lastUsedModelId && !lastUsedModelId.includes('@@')) saveLastUsedModel(modelToSelect.id);
    } catch (error) {
      console.error('Error while fetching models', error);
      setModels([]);
      setSelectedModel(null);
    } finally {
      setIsLoadingModels(false);
    }
  }, [searchParams, baseUrlsList, bootstrapProviders]);

  // Fetch models when providers are available and user is authenticated
  // Intentionally NOT dependent on balance to avoid reloading the selector on wallet updates
  useEffect(() => {
    if (!isAuthenticated) return;
    // Always attempt to fetch; will bootstrap providers if missing
    fetchModels(balance);
  }, [isAuthenticated, baseUrlsList.length]);

  // Auto-select model based on balance when balance changes
  // Only auto-selects if no model is selected or current model is not available
  useEffect(() => {
    if (!isAuthenticated || models.length === 0) return;
    
    // Check if current model is available with current balance
    const isCurrentModelAvailable = selectedModel && (() => {
      try {
        const sp: any = selectedModel?.sats_pricing as any;
        if (!sp) return true; // If no pricing info, assume available
        const required = Math.max(
          Number(sp.max_cost) || 0,
          Number(sp.max_completion_cost) || 0
        );
        return required <= 0 || balance >= required;
      } catch {
        return true;
      }
    })();

    // Only auto-select if no model is selected or current model is not available
    if (!selectedModel || !isCurrentModelAvailable) {
      const compatible = models.filter((m: Model) => {
        try {
          const sp: any = m.sats_pricing as any;
          if (!sp) return false;
          const required = Math.max(
            Number(sp.max_cost) || 0,
            Number(sp.max_completion_cost) || 0
          );
          return required > 0 && balance >= required;
        } catch {
          return false;
        }
      });
      
      if (compatible.length > 0) {
        // Select the first compatible model (models are already sorted by price)
        handleModelChange(compatible[0].id);
      }
    }
  }, [balance, models, isAuthenticated, selectedModel]);

  const handleModelChange = useCallback((modelId: string, configuredKeyOverride?: string) => {
    console.log('rdlogs: handleModelChange', modelId, configuredKeyOverride);
    // If a provider base is explicitly provided, prefer provider-specific model from storage
    if (configuredKeyOverride && configuredKeyOverride.includes('@@')) {
      const parsed = parseModelKey(configuredKeyOverride!);
      const fixedBaseRaw = parsed.base;
      const fixedBase = normalizeBaseUrl(fixedBaseRaw);
      if (!fixedBase) return;
      try {
        const normalized = fixedBase.endsWith('/') ? fixedBase : `${fixedBase}/`;
        const allByProvider = getStorageItem<Record<string, Model[]>>('modelsFromAllProviders', {} as any);
        const list = allByProvider?.[normalized] || allByProvider?.[configuredKeyOverride] || [] as any;
        let providerSpecific = Array.isArray(list) ? list.find((m: Model) => m.id === parsed.id) : undefined;
        // If not found locally, fetch on-demand from provider and cache
        const ensureFetched = async (): Promise<Model | undefined> => {
          if (providerSpecific) return providerSpecific;
          try {
            const res = await fetch(`${normalized}v1/models`);
            if (!res.ok) throw new Error(`Failed ${res.status}`);
            const json = await res.json();
            const freshList: Model[] = Array.isArray(json?.data) ? json.data : [];
            // cache back to storage
            upsertCachedProviderModels(normalized, freshList);
            return freshList.find((m: Model) => m.id === parsed.id);
          } catch {
            return undefined;
          }
        };
        // Note: handleModelChange isn't async; fire-and-forget then early return after success
        if (!providerSpecific) {
          void (async () => {
            const fetched = await ensureFetched();
            if (fetched) {
              setSelectedModel(fetched);
              saveLastUsedModel(configuredKeyOverride!);
              setBaseUrl(normalized);
            }
          })();
          return;
        }
        console.log('rdlogs: providerSpecific', providerSpecific);
        if (providerSpecific) {
          setSelectedModel(providerSpecific);
          saveLastUsedModel(configuredKeyOverride);
          setBaseUrl(normalized);
          return;
        }
      } catch (e) {
        console.error('Failed to load provider-specific model from storage', e);
      }
    }
    else {
      // Fallback: use currently loaded combined models
      const model = models.find((m: Model) => m.id === modelId);
      if (model) {
        setSelectedModel(model);
        saveLastUsedModel(modelId);
        // Switch provider base URL if a provider is configured for this model
        try {
          const map = loadModelProviderMap();
          const mappedBase = map[modelId];
          console.log('rdlogs: mappedBase', mappedBase);
          if (mappedBase && typeof mappedBase === 'string' && mappedBase.length > 0) {
            const normalized = mappedBase.endsWith('/') ? mappedBase : `${mappedBase}/`;
            setBaseUrl(normalized);
          }
        } catch {}
      }
    }

  }, [models]);

  const setBaseUrl = useCallback((url: string) => {
    const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
    setBaseUrlState(normalizedUrl);
    saveBaseUrl(normalizedUrl);
    const updatedBaseUrlsList = loadBaseUrlsList();
    setBaseUrlsList(updatedBaseUrlsList);
  }, []);

  return {
    models,
    selectedModel,
    isLoadingModels,
    baseUrl,
    setModels,
    setSelectedModel,
    setIsLoadingModels,
    setBaseUrl,
    fetchModels,
    handleModelChange
  };
};