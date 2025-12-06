export type Profile = {
  id: string;
  displayName: string;
  mode?: "simple" | "advanced";
  birthYear?: number;
  isDefault?: boolean;
};

export type PhLog = {
  ph: number;
  note?: string;
  date: Date;
};

export type PralFoodItem = {
  name: string;
  pral: number;
  category?: string;
  portion?: string;
};

export type PralSearchResult = {
  query: string;
  items: PralFoodItem[];
  fetchedAt: number;
  cached?: boolean;
};
