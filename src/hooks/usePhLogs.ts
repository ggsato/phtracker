import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { PhLog } from "../types";

const storageKey = (profileId: string) => `phtracker.logs.${profileId}`;
const MAX_LOGS = 50;

export const usePhLogs = (profileId?: string) => {
  const [logs, setLogs] = useState<PhLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const readCachedLogs = useCallback((id: string) => {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as { ph: number; note?: string; date: string }[];
      return parsed.map((item) => ({ ...item, date: new Date(item.date) }));
    } catch (err) {
      console.warn("Could not parse stored logs", err);
      return [];
    }
  }, []);

  const cacheLogs = useCallback((id: string, entries: PhLog[]) => {
    localStorage.setItem(
      storageKey(id),
      JSON.stringify(entries.map((item) => ({ ...item, date: item.date.toISOString() }))),
    );
  }, []);

  useEffect(() => {
    if (!profileId) return;
    setLogs(readCachedLogs(profileId));

    let canceled = false;
    const loadRemote = async () => {
      setLoading(true);
      setError(null);
      try {
        const remote = await apiClient.fetchPhLogs(profileId);
        if (canceled) return;
        setLogs(remote);
        cacheLogs(profileId, remote);
      } catch (err) {
        if (!canceled) {
          console.warn("Falling back to cached logs", err);
          setError(err as Error);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    loadRemote();
    return () => {
      canceled = true;
    };
  }, [profileId, cacheLogs, readCachedLogs]);

  const savePhLog = useCallback(
    async ({ ph, note }: { ph: number; note?: string }) => {
      if (!profileId) {
        throw new Error("Missing profile id for saving log");
      }
      const entry: PhLog = { ph, note, date: new Date() };
      setLogs((current) => {
        const next = [entry, ...current].slice(0, MAX_LOGS);
        cacheLogs(profileId, next);
        return next;
      });

      try {
        await apiClient.createPhLog(profileId, { ph, note });
      } catch (err) {
        console.warn("Saved locally, failed to sync to API", err);
        setError(err as Error);
      }
    },
    [profileId, cacheLogs],
  );

  const latestLog = useMemo(() => logs[0], [logs]);

  return { logs, latestLog, savePhLog, loading, error };
};
