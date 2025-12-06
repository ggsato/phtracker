import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n";
import { usePralSearch } from "./usePralSearch";

const okResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  } as Response);

describe("usePralSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("caches last query and sends profile_id", async () => {
    const fetchMock = vi.fn(() => okResponse({ items: [{ name: "Spinach", pral: -14 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePralSearch("me"), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });

    await act(async () => {
      await result.current.search("spinach");
    });

    const cached = JSON.parse(localStorage.getItem("phtracker.pral.me") ?? "{}");
    expect(cached.query).toBe("spinach");
    expect(cached.items[0].name).toBe("Spinach");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pral/search",
      expect.objectContaining({
        body: JSON.stringify({ query: "spinach", profile_id: "me" }),
      }),
    );
  });
});
