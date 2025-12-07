import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PH_BANDS, normalizeBands, PhBands, isValidBands } from "../lib/phBands";

const STORAGE_KEY = "phtracker.phBands";

const readStored = (): PhBands | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = normalizeBands(JSON.parse(raw) as PhBands);
    return isValidBands(parsed) ? parsed : null;
  } catch (err) {
    console.warn("Could not parse stored pH bands", err);
    return null;
  }
};

export const usePhBands = () => {
  const [bands, setBandsState] = useState<PhBands>(DEFAULT_PH_BANDS);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setBandsState(stored);
    }
  }, []);

  const setBands = useCallback((next: PhBands) => {
    const normalized = normalizeBands(next);
    setBandsState(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }, []);

  const resetBands = useCallback(() => {
    setBands(DEFAULT_PH_BANDS);
  }, [setBands]);

  return { bands, setBands, resetBands };
};

export type { PhBands };
