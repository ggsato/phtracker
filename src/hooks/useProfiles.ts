import { useEffect, useState } from "react";

export type Profile = {
  id: string;
  displayName: string;
  mode?: "simple" | "advanced";
  birthYear?: number;
  isDefault?: boolean;
};

const STORAGE_KEY = "phtracker.profiles";
const CURRENT_KEY = "phtracker.currentProfileId";

const defaultProfiles: Profile[] = [
  { id: "me", displayName: "Me", mode: "advanced", isDefault: true },
  { id: "grandma", displayName: "Grandma", mode: "simple" },
];

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>(defaultProfiles);
  const [currentProfileId, setCurrentProfileId] = useState<string>(defaultProfiles[0].id);

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(CURRENT_KEY, currentProfileId);
  }, [currentProfileId]);

  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  return {
    profiles,
    currentProfile,
    currentProfileId,
    setProfiles,
    setCurrentProfile: setCurrentProfileId,
  };
};
