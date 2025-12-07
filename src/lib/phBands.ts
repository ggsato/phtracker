export type PhBands = {
  acidicUpper: number;
  slightlyAcidicUpper: number;
  neutralUpper: number;
  slightlyAlkalineUpper: number;
};

export type PhCategoryKey =
  | "acidityAcidic"
  | "aciditySlightlyAcidic"
  | "acidityNeutral"
  | "aciditySlightlyAlkaline"
  | "acidityAlkaline";

type PhCategory = {
  labelKey: PhCategoryKey;
  colorScheme: "red" | "orange" | "green" | "teal" | "blue";
};

export const DEFAULT_PH_BANDS: PhBands = {
  acidicUpper: 5.75,
  slightlyAcidicUpper: 6.5,
  neutralUpper: 7.25,
  slightlyAlkalineUpper: 7.5,
};

export const categorizePh = (ph: number, bands: PhBands): PhCategory => {
  if (ph <= bands.acidicUpper) {
    return { labelKey: "acidityAcidic", colorScheme: "red" };
  }
  if (ph <= bands.slightlyAcidicUpper) {
    return { labelKey: "aciditySlightlyAcidic", colorScheme: "orange" };
  }
  if (ph <= bands.neutralUpper) {
    return { labelKey: "acidityNeutral", colorScheme: "green" };
  }
  if (ph <= bands.slightlyAlkalineUpper) {
    return { labelKey: "aciditySlightlyAlkaline", colorScheme: "teal" };
  }
  return { labelKey: "acidityAlkaline", colorScheme: "blue" };
};

export const isValidBands = (bands: PhBands): boolean => {
  const { acidicUpper, slightlyAcidicUpper, neutralUpper, slightlyAlkalineUpper } = bands;
  const ascending =
    acidicUpper < slightlyAcidicUpper &&
    slightlyAcidicUpper < neutralUpper &&
    neutralUpper < slightlyAlkalineUpper;
  const withinRange =
    acidicUpper >= 4.5 &&
    slightlyAcidicUpper <= 8.5 &&
    neutralUpper <= 8.5 &&
    slightlyAlkalineUpper <= 8.5;
  return ascending && withinRange;
};

export const normalizeBands = (bands: PhBands): PhBands => ({
  acidicUpper: Number(bands.acidicUpper),
  slightlyAcidicUpper: Number(bands.slightlyAcidicUpper),
  neutralUpper: Number(bands.neutralUpper),
  slightlyAlkalineUpper: Number(bands.slightlyAlkalineUpper),
});
