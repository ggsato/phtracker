import { PhLog, PralFoodItem, Profile } from "../types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
const USER_ID = import.meta.env.VITE_API_USER_ID as string | undefined;

const buildUrl = (path: string) => {
  const normalizedBase = BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = RequestInit & { parseJson?: boolean };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { parseJson = true, headers, body, ...rest } = options;
  const url = buildUrl(path);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(USER_ID ? { "x-user-id": USER_ID } : {}),
      ...headers,
    },
    body,
    ...rest,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const message = `API error ${res.status} ${res.statusText || ""} at ${url}${
      text ? `: ${text}` : ""
    }`;
    // Log once for debugging sync failures; UI handles the user-facing warning separately.
    console.error(message);
    throw new ApiError(message, res.status);
  }

  if (!parseJson || res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

type ProfileResponse = { profile_id: string; display_name: string };
type PhLogResponse = { ph: number; notes?: string; date: string; profile_id: string };
type FoodResponse = { id: string; name: string; category?: string; pral?: number };

export const apiClient = {
  async fetchProfiles(): Promise<Profile[]> {
    const data = await request<ProfileResponse[]>("/profiles", { method: "GET" });
    return data.map((p) => ({
      id: p.profile_id,
      displayName: p.display_name || p.profile_id,
    }));
  },

  async fetchPhLogs(profileId: string, limit = 50): Promise<PhLog[]> {
    const data = await request<{ items: PhLogResponse[] }>(
      `/ph-logs?profile_id=${encodeURIComponent(profileId)}&limit=${limit}`,
      { method: "GET" },
    );

    return (data.items || []).map((item) => ({
      ph: item.ph,
      note: item.notes,
      date: new Date(item.date),
    }));
  },

  async createPhLog(profileId: string, payload: { ph: number; note?: string }): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    await request(`/ph-logs`, {
      method: "POST",
      body: JSON.stringify({
        profile_id: profileId,
        ph: payload.ph,
        notes: payload.note,
        date: today,
      }),
      parseJson: false,
    });
  },

  async searchPral(profileId: string, query: string): Promise<{ items: PralFoodItem[] }> {
    const data = await request<{ items: FoodResponse[] }>(
      `/foods?query=${encodeURIComponent(query)}&limit=50`,
      { method: "GET" },
    );
    return {
      items: (data.items || []).map((item) => ({
        name: item.name,
        pral: item.pral ?? 0,
        category: item.category,
      })),
    };
  },
};

export type { ApiError };
