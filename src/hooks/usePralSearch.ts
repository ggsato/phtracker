import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { apiClient } from "../lib/apiClient";
import { PralFoodItem, PralSearchResult } from "../types";

const cacheKey = (profileId?: string) => `phtracker.pral.${profileId ?? "default"}`;

export const usePralSearch = (profileId?: string) => {
  const { t } = useI18n();
  const [result, setResult] = useState<PralSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey(profileId));
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as PralSearchResult;
      setResult({ ...parsed, cached: true });
    } catch (err) {
      console.warn("Could not parse cached PRAL results", err);
    }
  }, [profileId]);

  const search = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      if (!profileId) {
        setError(t("pralSelectProfileError"));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.searchPral(profileId, trimmed);
        const items: PralFoodItem[] = data.items ?? data.results ?? [];
        const payload: PralSearchResult = {
          query: trimmed,
          items,
          fetchedAt: Date.now(),
        };
        setResult(payload);
        localStorage.setItem(cacheKey(profileId), JSON.stringify(payload));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not fetch PRAL results";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [profileId, t],
  );

  return { result, loading, error, search };
};
