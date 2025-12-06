import { useCallback, useEffect, useMemo, useState } from "react";

type PhLog = {
  ph: number;
  note?: string;
  date: Date;
};

const storageKey = (profileId: string) => `phtracker.logs.${profileId}`;

export const usePhLogs = (profileId?: string) => {
  const [logs, setLogs] = useState<PhLog[]>([]);

  useEffect(() => {
    if (!profileId) return;
    const raw = localStorage.getItem(storageKey(profileId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { ph: number; note?: string; date: string }[];
        setLogs(parsed.map((item) => ({ ...item, date: new Date(item.date) })));
      } catch (err) {
        console.warn("Could not parse stored logs", err);
      }
    } else {
      setLogs([]);
    }
  }, [profileId]);

  const persist = useCallback(
    (next: PhLog[]) => {
      if (!profileId) return;
      setLogs(next);
      localStorage.setItem(
        storageKey(profileId),
        JSON.stringify(next.map((item) => ({ ...item, date: item.date.toISOString() }))),
      );
    },
    [profileId],
  );

  const savePhLog = useCallback(
    async ({ ph, note }: { ph: number; note?: string }) => {
      const entry: PhLog = { ph, note, date: new Date() };
      persist([entry, ...logs].slice(0, 50)); // keep recent entries small for offline cache
    },
    [logs, persist],
  );

  const latestLog = useMemo(() => logs[0], [logs]);

  return { logs, latestLog, savePhLog };
};
