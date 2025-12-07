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
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sends profile_id when creating a pH log", async () => {
    vi.setSystemTime(new Date("2024-01-02T12:00:00Z"));
    const fetchMock = vi.fn(() => okResponse({}, 201));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.createPhLog("abc", { ph: 7.1, note: "test" });

    const call = fetchMock.mock.calls[0];
    expect(call[0]).toContain("/ph-logs");
    expect(call[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          profile_id: "abc",
          ph: 7.1,
          notes: "test",
          date: "2024-01-02",
        }),
      }),
    );
  });

  it("parses fetched logs into Date instances", async () => {
    const fetchMock = vi.fn(() =>
      okResponse({ items: [{ ph: 6.9, notes: "am", date: "2024-01-01" }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const logs = await apiClient.fetchPhLogs("me");

    expect(logs[0].date instanceof Date).toBe(true);
    expect(logs[0].ph).toBe(6.9);
  });
});
