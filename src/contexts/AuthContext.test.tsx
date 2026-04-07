import { describe, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

/**
 * Wave 0 stubs for Phase 7 — AuthContext migration to HttpOnly cookie.
 * All tests are inside describe.skip and will be enabled in Plan 03.
 *
 * Covers VALIDATION.md task IDs:
 *   07-03-01  calls GET /auth/me on init to rehydrate auth state
 *   07-03-02  does not read or write localStorage
 *   + starts with loading=true and only renders children after /auth/me resolves
 *
 * TODO: enable after Plan 03 implementation
 */

// eslint-disable-next-line vitest/no-disabled-tests
describe.skip("AuthContext Phase 7", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── 07-03-01 ──────────────────────────────────────────────────────────────

  it("calls GET /auth/me on init to rehydrate auth state", async () => {
    // TODO: enable after Plan 03 implementation
    //
    // import { AuthProvider, useAuth } from "@/contexts/AuthContext";
    // import api from "@/lib/api";
    //
    // Setup: mock api.get("/auth/me") to resolve with:
    //   { data: { data: { name: "Test", email: "test@test.com", role: "ADMIN" } } }
    //
    // const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
    //   data: { data: { name: "Test", email: "test@test.com", role: "ADMIN" } },
    // });
    //
    // const TestChild = () => {
    //   const { isAuthenticated } = useAuth();
    //   return <div data-testid="auth">{isAuthenticated ? "yes" : "no"}</div>;
    // };
    //
    // const { findByTestId } = render(
    //   <AuthProvider>
    //     <TestChild />
    //   </AuthProvider>
    // );
    //
    // expect(getSpy).toHaveBeenCalledWith("/auth/me");
    // const el = await findByTestId("auth");
    // expect(el.textContent).toBe("yes");
  });

  // ── 07-03-02 ──────────────────────────────────────────────────────────────

  it("does not read or write localStorage", async () => {
    // TODO: enable after Plan 03 implementation
    //
    // import { AuthProvider } from "@/contexts/AuthContext";
    // import api from "@/lib/api";
    //
    // Setup: mock api.post("/auth/login") to resolve (cookie handled by browser)
    // const getItemSpy = vi.spyOn(localStorage, "getItem");
    // const setItemSpy = vi.spyOn(localStorage, "setItem");
    //
    // Render AuthProvider and trigger login()
    // const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    // await act(() => result.current.login({ email: "a@a.com", password: "pass" }));
    //
    // expect(getItemSpy).not.toHaveBeenCalled();
    // expect(setItemSpy).not.toHaveBeenCalled();
  });

  // ── supplemental ──────────────────────────────────────────────────────────

  it("starts with loading=true and only renders children after /auth/me resolves", async () => {
    // TODO: enable after Plan 03 implementation
    //
    // import { AuthProvider, useAuth } from "@/contexts/AuthContext";
    // import api from "@/lib/api";
    //
    // Setup: delay the /auth/me response artificially
    // let resolve: (val: unknown) => void;
    // const deferred = new Promise((res) => { resolve = res; });
    // vi.spyOn(api, "get").mockReturnValueOnce(deferred as Promise<unknown>);
    //
    // const { queryByTestId } = render(
    //   <AuthProvider>
    //     <div data-testid="child">hello</div>
    //   </AuthProvider>
    // );
    //
    // Before resolution: children should not be visible
    // expect(queryByTestId("child")).not.toBeInTheDocument();
    //
    // Resolve the promise and wait
    // resolve({ data: { data: { name: "T", email: "t@t.com", role: "ADMIN" } } });
    // expect(await findByTestId("child")).toBeInTheDocument();
  });
});
