import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth, UNAUTHORIZED_ERROR_MSG } from "@/hooks/useAuth";
import * as firebaseAuth from "firebase/auth";

let authCallback: ((user: unknown) => void) | null = null;

vi.mock("@/services/firebase", () => ({
  auth: { currentUser: null },
  googleProvider: {},
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth, callback) => {
    authCallback = callback;
    return vi.fn(); // Unsubscribe mock
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;
    vi.stubEnv("VITE_AUTHOR_UID", "author-owner-uid");
  });

  it("should initialize with loading true and no user", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthorized).toBe(false);
  });

  it("should authorize user when UID matches VITE_AUTHOR_UID", () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      if (authCallback) {
        authCallback({
          uid: "author-owner-uid",
          email: "author@test.com",
          displayName: "Autor",
        });
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthorized).toBe(true);
    expect(result.current.user?.uid).toBe("author-owner-uid");
    expect(result.current.error).toBeNull();
  });

  it("should reject and sign out user when UID does not match VITE_AUTHOR_UID", () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      if (authCallback) {
        authCallback({
          uid: "intruder-uid-999",
          email: "stranger@test.com",
          displayName: "Estranho",
        });
      }
    });

    expect(firebaseAuth.signOut).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe(UNAUTHORIZED_ERROR_MSG);
  });

  it("should handle signInWithGoogle for authorized user", async () => {
    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: {
        uid: "author-owner-uid",
        email: "author@test.com",
      },
    } as unknown as firebaseAuth.UserCredential);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
    expect(result.current.isAuthorized).toBe(true);
    expect(result.current.user?.uid).toBe("author-owner-uid");
  });

  it("should sign out immediately if signInWithGoogle yields unauthorized UID", async () => {
    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: {
        uid: "unauthorized-uid",
      },
    } as unknown as firebaseAuth.UserCredential);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(firebaseAuth.signOut).toHaveBeenCalled();
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.error).toBe(UNAUTHORIZED_ERROR_MSG);
  });

  it("should logout successfully and clear state", async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      if (authCallback) {
        authCallback({ uid: "author-owner-uid" });
      }
    });

    expect(result.current.isAuthorized).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(firebaseAuth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthorized).toBe(false);
  });

  it("should handle signInWithGoogle errors and cancellation", async () => {
    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(
      new Error("auth/popup-closed-by-user")
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(result.current.error).toBeNull();

    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(
      new Error("Erro de rede")
    );

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(result.current.error).toBe("Erro de rede");
  });
});
