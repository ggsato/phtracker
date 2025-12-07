import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Locale = "ja" | "en";

type Messages = {
  [key in Locale]: Record<string, string>;
};

const STORAGE_KEY = "phtracker.locale";

const messages: Messages = {
  ja: {
    simpleLabel: "かんたんモード",
    simpleHeading: "今日のpHを入力",
    simpleDescription: "大きなボタンですぐ保存。家族が数値だけ記録したいときに使いやすい画面です。",
    simpleAutosaveHint: "5.0〜7.5のあいだで0.25刻み。数字を押すと自動で保存されます。",
    acidityAcidic: "酸性寄り",
    aciditySlightlyAcidic: "やや酸性寄り",
    acidityNeutral: "中性に近い",
    aciditySlightlyAlkaline: "ややアルカリ寄り",
    acidityAlkaline: "アルカリ寄り",
    acidityRangesTitle: "pHの目安レンジ",
    acidityRangesDescription: "ご本人に合わせて酸性・中性・アルカリ性の境界を変えられます（かんたんモードの色分けに適用）。",
    acidityRangesHintDefault: "デフォルト: 5.75 / 6.5 / 7.25 / 7.5",
    aciditySave: "レンジを保存",
    acidityReset: "デフォルトに戻す",
    acidityInvalidOrder: "値は小さい順に設定してください（6.4 < 6.74 < 7.1 < 7.3 のように）。",
    aciditySaved: "レンジを保存しました",
    sliderAria: "pHの値",
    sliderLow: "酸性 4.5",
    sliderHigh: "アルカリ性 8.5",
    wholeNumberLabel: "整数を選ぶ",
    decimalLabel: "小数を選ぶ",
    rangeLabel: "範囲: {min} 〜 {max}",
    saveReading: "保存する",
    sameAsUsual: "いつも通り",
    notFeelingWell: "体調が良くない",
    missingProfileTitle: "プロフィールを選択してください",
    missingProfileDescription: "誰の記録か選んでから保存してください。",
    savedTitle: "保存しました",
    savedDescription: "{name}のpHを記録しました",
    phUnits: "pH単位",
    offlineTitle: "オフラインのデータを使用中",
    offlineBody: "APIと同期できなかったため、デバイス内のデータを表示しています。",
    lastSavedLabel: "最新の記録",
    lastSavedEntry: "{value} （{date} {note}）",
    noEntries: "まだ記録がありません。最初の保存がここに表示されます。",
    expertLabel: "エキスパートモード",
    expertHeading: "詳しい分析",
    expertDescription: "ここにチャートやフィルターをつなげて分析ビューを作り込んでください。",
    statsLatest: "最新のpH",
    statsTrend: "傾向",
    statsEntries: "今週の記録数",
    statsPral: "PRAL簡易チェック",
    trendSteady: "安定",
    trendNone: "データなし",
    entriesZero: "0",
    chartsHeading: "チャート（準備スペース）",
    chartsDescription:
      "時系列グラフや移動平均、PRAL比較などをここに配置。重いコンポーネントは遅延読み込みにして、かんたんモードを軽く保ちます。",
    filtersHeading: "フィルター（準備スペース）",
    filtersDescription:
      "日付範囲やプロフィール切り替え、症状タグなどの高度な操作を配置できます。かんたんモードのユーザーからは隠しておけます。",
    pralHeading: "PRALクイック検索",
    pralDescription: "一度検索するとオフラインでもキャッシュが使えます。APIには profile_id を付与。",
    pralPlaceholder: "例: ほうれん草、ヨーグルト、鶏むね肉",
    pralSearching: "PRALを検索中...",
    pralLastQuery: "直近の検索: {query}",
    pralUpdated: "更新: {date}",
    pralNoResults: "PRALの結果がありませんでした。",
    pralNoQueries: "まだPRAL検索をしていません。食品名を入れて検索してみてください。",
    pralOffline: "オフラインキャッシュ",
    pralFresh: "最新",
    csvExport: "CSV書き出し（準備中）",
    profileTooltip: "誰を記録するか選んでください",
    profilePlaceholder: "プロフィールを選択",
    profileLoading: "読み込み中...",
    pralSelectProfileError: "先にプロフィールを選んでください。",
    ariaSimple: "かんたんモード",
    ariaExpert: "エキスパートモード",
    pralCardLabel: "食品",
    languageAria: "言語の切り替え",
    languageJa: "日本語",
    languageEn: "English",
  },
  en: {
    simpleLabel: "Simple mode",
    simpleHeading: "Enter today’s pH",
    simpleDescription: "Big controls and quick save—friendly for family who just need to log a value.",
    simpleAutosaveHint: "Range 5.0–7.5 in 0.25 steps. Pick numbers and we auto-save.",
    acidityAcidic: "More acidic",
    aciditySlightlyAcidic: "Slightly acidic",
    acidityNeutral: "Near neutral",
    aciditySlightlyAlkaline: "Slightly alkaline",
    acidityAlkaline: "More alkaline",
    acidityRangesTitle: "pH band settings",
    acidityRangesDescription: "Adjust the breakpoints that color-code acidity/alkalinity in simple mode.",
    acidityRangesHintDefault: "Defaults: 5.75 / 6.5 / 7.25 / 7.5",
    aciditySave: "Save bands",
    acidityReset: "Reset to defaults",
    acidityInvalidOrder: "Please keep values in ascending order (e.g., 6.4 < 6.74 < 7.1 < 7.3).",
    aciditySaved: "Saved bands",
    sliderAria: "pH value",
    sliderLow: "Acidic 4.5",
    sliderHigh: "Basic 8.5",
    wholeNumberLabel: "Pick the whole number",
    decimalLabel: "Pick the decimal",
    rangeLabel: "Range: {min} – {max}",
    saveReading: "Save reading",
    sameAsUsual: "Same as usual",
    notFeelingWell: "Not feeling well",
    missingProfileTitle: "Select a profile",
    missingProfileDescription: "Pick who you are tracking before saving.",
    savedTitle: "Saved",
    savedDescription: "Logged pH for {name}",
    phUnits: "pH units",
    offlineTitle: "Using offline cache",
    offlineBody: "Could not sync with the API. Showing locally stored entries.",
    lastSavedLabel: "Last saved",
    lastSavedEntry: "{value} on {date} {note}",
    noEntries: "No entries yet. First save will show here.",
    expertLabel: "Expert mode",
    expertHeading: "Deeper insights",
    expertDescription: "Wire charts and filters to your analytics and PRAL calculations.",
    statsLatest: "Latest pH",
    statsTrend: "Trend",
    statsEntries: "Entries this week",
    statsPral: "PRAL quick check",
    trendSteady: "Steady",
    trendNone: "No data",
    entriesZero: "0",
    chartsHeading: "Charts placeholder",
    chartsDescription:
      "Insert time-series pH charts, moving averages, urinary PRAL comparisons. Lazy-load heavy widgets.",
    filtersHeading: "Filters placeholder",
    filtersDescription: "Date range, profile switch, symptom tags. Keep advanced controls away from simple users.",
    pralHeading: "PRAL quick search",
    pralDescription: "Cached offline after first lookup. Always include profile_id with the API call.",
    pralPlaceholder: "e.g. spinach, yogurt, chicken breast",
    pralSearching: "Searching PRAL...",
    pralLastQuery: "Last query: {query}",
    pralUpdated: "Updated: {date}",
    pralNoResults: "No PRAL matches returned.",
    pralNoQueries: "No PRAL lookups yet. Try a food name.",
    pralOffline: "Offline cache",
    pralFresh: "Fresh",
    csvExport: "Export CSV (stub)",
    profileTooltip: "Choose who you are tracking",
    profilePlaceholder: "Choose profile",
    profileLoading: "Loading...",
    pralSelectProfileError: "Select a profile first.",
    ariaSimple: "Simple mode",
    ariaExpert: "Expert mode",
    pralCardLabel: "Food",
    languageAria: "Change language",
    languageJa: "日本語",
    languageEn: "English",
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: keyof typeof messages["en"], params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === "ja" || stored === "en")) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const t = useMemo(() => {
    return (key: keyof typeof messages["en"], params?: Record<string, string | number>) => {
      const raw = messages[locale][key] ?? key;
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? ""));
    };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
};

export type { Locale };
