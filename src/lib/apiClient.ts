import { PhLog, PralFoodItem, Profile } from "../types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

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
  const res = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body,
    ...rest,
  });

  if (!res.ok) {
    const message = `API error ${res.status}`;
    throw new ApiError(message, res.status);
  }

  if (!parseJson || res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

type PhLogResponse = { ph: number; note?: string; date: string; profile_id?: string };

type PralResponse = {
  query?: string;
  items?: PralFoodItem[];
  results?: PralFoodItem[];
  cached?: boolean;
};

export const apiClient = {
  async fetchProfiles(): Promise<Profile[]> {
    const data = await request<Profile[]>("/profiles", { method: "GET" });
    return data.map((p) => ({
      ...p,
      displayName: p.displayName ?? p.id,
    }));
  },

  async fetchPhLogs(profileId: string, limit = 50): Promise<PhLog[]> {
    const data = await request<PhLogResponse[]>(
      `/profiles/${profileId}/ph-logs?limit=${limit}`,
      { method: "GET" },
    );

    return data.map((item) => ({
      ph: item.ph,
      note: item.note,
      date: new Date(item.date),
    }));
  },

  async createPhLog(profileId: string, payload: { ph: number; note?: string }): Promise<void> {
    await request(`/profiles/${profileId}/ph-logs`, {
      method: "POST",
      body: JSON.stringify({ ...payload, profile_id: profileId }),
      parseJson: false,
    });
  },

  async searchPral(profileId: string, query: string): Promise<PralResponse> {
    return request<PralResponse>("/pral/search", {
      method: "POST",
      body: JSON.stringify({ query, profile_id: profileId }),
    });
  },
};

export type { ApiError };
