import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { FiUsers } from "react-icons/fi";
import { useProfiles } from "../hooks/useProfiles";
import { useI18n } from "../i18n";

const ProfileSwitcher = () => {
  const { profiles, currentProfileId, setCurrentProfile, loading } = useProfiles();
  const { t } = useI18n();

  const options = useMemo(
    () => profiles.map((p) => ({ label: p.displayName, value: p.id })),
    [profiles],
  );

  const Icon = FiUsers;
  const currentLabel = options.find((opt) => opt.value === currentProfileId)?.label ?? t("profilePlaceholder");

  return (
    <Menu>
      <Tooltip label={t("profileTooltip")}
        hasArrow>
        <MenuButton
          as={IconButton}
          aria-label={t("profileTooltip")}
          icon={<Icon />}
          variant="ghost"
          isDisabled={!options.length || loading}
          title={currentLabel}
        />
      </Tooltip>
      <MenuList>
        {options.map((opt) => (
          <MenuItem key={opt.value} onClick={() => setCurrentProfile(opt.value)}>
            {currentProfileId === opt.value ? "✓ " : ""}
            {opt.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default ProfileSwitcher;
