import { Select, Tooltip } from "@chakra-ui/react";
import { useMemo } from "react";
import { useProfiles } from "../hooks/useProfiles";
import { useI18n } from "../i18n";

const ProfileSwitcher = () => {
  const { profiles, currentProfileId, setCurrentProfile, loading } = useProfiles();
  const { t } = useI18n();

  const options = useMemo(
    () => profiles.map((p) => ({ label: p.displayName, value: p.id })),
    [profiles],
  );

  return (
    <Tooltip label={t("profileTooltip")} hasArrow>
      <Select
        maxW="180px"
        size="md"
        variant="filled"
        bg="white"
        placeholder={loading ? t("profileLoading") : t("profilePlaceholder")}
        value={currentProfileId}
        isDisabled={!options.length || loading}
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
