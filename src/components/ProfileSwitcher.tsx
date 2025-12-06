import { useMemo } from "react";
import { Select, Tooltip } from "@chakra-ui/react";
import { useProfiles } from "../hooks/useProfiles";

const ProfileSwitcher = () => {
  const { profiles, currentProfileId, setCurrentProfile } = useProfiles();

  const options = useMemo(
    () => profiles.map((p) => ({ label: p.displayName, value: p.id })),
    [profiles],
  );

  return (
    <Tooltip label="Choose who you are tracking" hasArrow>
      <Select
        maxW="180px"
        size="md"
        variant="filled"
        bg="white"
        value={currentProfileId}
        onChange={(e) => setCurrentProfile(e.target.value)}
      >
        {options.map((opt) => (
          <option value={opt.value} key={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </Tooltip>
  );
};

export default ProfileSwitcher;
