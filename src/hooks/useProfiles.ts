import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { Profile } from "../types";

const STORAGE_KEY = "phtracker.profiles";
const CURRENT_KEY = "phtracker.currentProfileId";

const defaultProfiles: Profile[] = [
  { id: "me", displayName: "Me", mode: "advanced", isDefault: true },
  { id: "grandma", displayName: "Grandma", mode: "simple" },
];

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>(defaultProfiles);
  const [currentProfileId, setCurrentProfileId] = useState<string>(defaultProfiles[0].id);
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
        if (canceled || !remote.length) return;

        setProfiles(remote);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));

        const savedCurrent = localStorage.getItem(CURRENT_KEY);
        const savedExists = savedCurrent && remote.some((p) => p.id === savedCurrent);
        const preferred =
          (savedExists && savedCurrent) ||
          remote.find((p) => p.isDefault)?.id ||
          remote[0].id;

        if (preferred) {
          setCurrentProfileId(preferred);
        }
      } catch (err) {
        if (!canceled) {
          console.warn("Could not load profiles from API, using cached/default", err);
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
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(CURRENT_KEY, currentProfileId);
  }, [currentProfileId]);

  const currentProfile = useMemo(
    () => profiles.find((p) => p.id === currentProfileId),
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
