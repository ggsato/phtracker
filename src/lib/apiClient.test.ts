import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./apiClient";

const okResponse = (data: unknown, status = 200) =>
  Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  } as Response);

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends profile_id when creating a pH log", async () => {
    const fetchMock = vi.fn(() => okResponse({}, 204));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.createPhLog("abc", { ph: 7.1, note: "test" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profiles/abc/ph-logs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ph: 7.1, note: "test", profile_id: "abc" }),
      }),
    );
  });

  it("parses fetched logs into Date instances", async () => {
    const fetchMock = vi.fn(() =>
      okResponse([{ ph: 6.9, note: "am", date: "2024-01-01T00:00:00Z" }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const logs = await apiClient.fetchPhLogs("me");

    expect(logs[0].date instanceof Date).toBe(true);
    expect(logs[0].ph).toBe(6.9);
  });
});
