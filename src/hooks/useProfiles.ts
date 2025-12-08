import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { Profile } from "../types";

const STORAGE_KEY = "phtracker.profiles";
const CURRENT_KEY = "phtracker.currentProfileId";

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const savedProfiles = localStorage.getItem(STORAGE_KEY);
    const savedCurrent = localStorage.getItem(CURRENT_KEY);

    if (savedProfiles) {
      try {
        const parsed: Profile[] = JSON.parse(savedProfiles);
        setProfiles(parsed);
      } catch (err) {
        console.warn("Could not parse saved profiles", err);
      }
    }

    if (savedCurrent) {
      setCurrentProfileId(savedCurrent);
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const remote = await apiClient.fetchProfiles();
        if (canceled) return;
        let nextProfiles = remote;
        if (!remote.length) {
          const created = await apiClient.createProfile("Me");
          nextProfiles = [created];
        }

        setProfiles(nextProfiles);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfiles));

        const savedCurrent = localStorage.getItem(CURRENT_KEY);
        const savedExists = savedCurrent && nextProfiles.some((p) => p.id === savedCurrent);
        const preferred =
          (savedExists && savedCurrent) ||
          nextProfiles.find((p) => p.isDefault)?.id ||
          (nextProfiles[0] ? nextProfiles[0].id : null);

        if (preferred) {
          setCurrentProfileId(preferred);
        }
      } catch (err) {
        if (!canceled) {
          console.warn("Could not load profiles from API, using cached values if any", err);
          setError(err as Error);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    fetchProfiles();
    return () => {
      canceled = true;
    };
  }, [currentProfileId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (currentProfileId) {
      localStorage.setItem(CURRENT_KEY, currentProfileId);
    }
  }, [currentProfileId]);

  const currentProfile = useMemo(
    () => profiles.find((p) => p.id === currentProfileId) || null,
    [profiles, currentProfileId],
  );

  return {
    profiles,
    currentProfile,
    currentProfileId,
    setProfiles,
    setCurrentProfile: setCurrentProfileId,
    loading,
    error,
  };
};
