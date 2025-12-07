import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
} from "@chakra-ui/react";
import { FiGlobe } from "react-icons/fi";
import { Locale, useI18n } from "../i18n";

const LanguageToggle = () => {
  const { locale, setLocale, t } = useI18n();
  const Icon = FiGlobe;
  const currentLabel = locale === "ja" ? t("languageJa") : t("languageEn");

  return (
    <Menu>
      <Tooltip label={t("languageAria")}>
        <MenuButton
          as={IconButton}
          aria-label={t("languageAria")}
          icon={<Icon />}
          variant="ghost"
          title={currentLabel}
        />
      </Tooltip>
      <MenuList>
        <MenuItem onClick={() => setLocale("ja" as Locale)}>
          {locale === "ja" ? "✓ " : ""}
          {t("languageJa")}
        </MenuItem>
        <MenuItem onClick={() => setLocale("en" as Locale)}>
          {locale === "en" ? "✓ " : ""}
          {t("languageEn")}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default LanguageToggle;
