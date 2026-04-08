import { describe, it, expect, vi } from "vitest";
import api from "@/lib/api";

/**
 * Phase 7 — api.ts Axios configuration tests.
 * Covers VALIDATION.md task IDs:
 *   07-03-03  api.ts sends withCredentials: true
 *
 * Enabled in Plan 04.
 */

describe("api.ts Phase 7", () => {

  // ── 07-03-03 ──────────────────────────────────────────────────────────────

  it("has withCredentials: true in axios defaults", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("has no request interceptor that reads localStorage", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem");
    // Trigger interceptors without actually making a request
    const config = { headers: {} as Record<string, string> };
    // Access interceptor handlers directly
    // @ts-ignore — accessing internal axios structure
    const handlers = (api.interceptors.request as any).handlers;
    handlers.forEach((handler: any) => {
      if (handler && handler.fulfilled) {
        handler.fulfilled(config);
      }
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
