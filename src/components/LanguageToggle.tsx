import { Select } from "@chakra-ui/react";
import { Locale, useI18n } from "../i18n";

const LanguageToggle = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <Select
      maxW="140px"
      size="md"
      variant="filled"
      bg="white"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label={t("languageAria")}
    >
      <option value="ja">{t("languageJa")}</option>
      <option value="en">{t("languageEn")}</option>
    </Select>
  );
};

export default LanguageToggle;
