import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotes } from "@/hooks/useNotes";
import * as notesRepo from "@/services/notesRepository";
import type { NoteDocument } from "@/types/note";

let repoCallback: ((notes: NoteDocument[], meta?: { hasPendingWrites: boolean; fromCache: boolean }) => void) | null = null;
let repoErrorCallback: ((err: Error) => void) | null = null;

vi.mock("@/services/notesRepository", () => ({
  subscribeRecentNotes: vi.fn((_uid, onUpdate, onError) => {
    repoCallback = onUpdate;
    repoErrorCallback = onError;
    return vi.fn(); // Unsubscribe mock
  }),
  createNote: vi.fn(() => Promise.resolve("mock-new-id")),
  updateNote: vi.fn(() => Promise.resolve()),
  deleteNote: vi.fn(() => Promise.resolve()),
}));

describe("useNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoCallback = null;
    repoErrorCallback = null;
  });

  it("should initialize with empty notes and loading false if userId is undefined", () => {
    const { result } = renderHook(() => useNotes(undefined));

    expect(result.current.loading).toBe(false);
    expect(result.current.notes).toEqual([]);
    expect(notesRepo.subscribeRecentNotes).not.toHaveBeenCalled();
  });

  it("should subscribe to notes when userId is provided", () => {
    const { result } = renderHook(() => useNotes("user-123"));

    expect(notesRepo.subscribeRecentNotes).toHaveBeenCalledWith(
      "user-123",
      expect.any(Function),
      expect.any(Function)
    );

    const mockData: NoteDocument[] = [
      {
        id: "n1",
        text: "Nota de teste",
        tags: ["teste"],
        createdAt: 1000,
        updatedAt: 1000,
        userId: "user-123",
      },
    ];

    act(() => {
      if (repoCallback) {
        repoCallback(mockData, { hasPendingWrites: false, fromCache: false });
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.notes).toEqual(mockData);
    expect(result.current.syncStatus).toBe("synced");
  });

  it("should reflect syncing status when hasPendingWrites is true and synced when false", () => {
    const { result } = renderHook(() => useNotes("user-123"));

    act(() => {
      if (repoCallback) {
        repoCallback([], { hasPendingWrites: true, fromCache: true });
      }
    });

    expect(result.current.syncStatus).toBe("syncing");

    act(() => {
      if (repoCallback) {
        repoCallback([], { hasPendingWrites: false, fromCache: false });
      }
    });

    expect(result.current.syncStatus).toBe("synced");
  });

  it("should react to window online/offline events", () => {
    const { result } = renderHook(() => useNotes("user-123"));

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.syncStatus).toBe("offline");

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it("should invoke createNote via addNote and transition syncStatus to synced", async () => {
    const { result } = renderHook(() => useNotes("user-123"));

    let newId: string = "";
    await act(async () => {
      newId = await result.current.addNote("Nova anotação", ["ideias"]);
    });

    expect(notesRepo.createNote).toHaveBeenCalledWith("user-123", "Nova anotação", ["ideias"]);
    expect(newId).toBe("mock-new-id");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("should invoke updateNote via editNote and transition syncStatus to synced", async () => {
    const { result } = renderHook(() => useNotes("user-123"));

    await act(async () => {
      await result.current.editNote("n1", "Texto editado", ["tag1"]);
    });

    expect(notesRepo.updateNote).toHaveBeenCalledWith("user-123", "n1", "Texto editado", ["tag1"]);
    expect(result.current.syncStatus).toBe("synced");
  });

  it("should invoke deleteNote via removeNote and transition syncStatus to synced", async () => {
    const { result } = renderHook(() => useNotes("user-123"));

    await act(async () => {
      await result.current.removeNote("n1");
    });

    expect(notesRepo.deleteNote).toHaveBeenCalledWith("user-123", "n1");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("should handle error callback from subscription", () => {
    const { result } = renderHook(() => useNotes("user-123"));

    act(() => {
      if (repoErrorCallback) {
        repoErrorCallback(new Error("Erro de permissão no Firestore"));
      }
    });

    expect(result.current.error).toBe("Erro de permissão no Firestore");
    expect(result.current.syncStatus).toBe("error");
  });

  it("should handle error in editNote", async () => {
    vi.mocked(notesRepo.updateNote).mockRejectedValueOnce(new Error("Falha ao atualizar"));
    const { result } = renderHook(() => useNotes("user-123"));

    await act(async () => {
      try {
        await result.current.editNote("n1", "Texto", []);
      } catch {
        // Erro esperado
      }
    });

    expect(result.current.syncStatus).toBe("error");
    expect(result.current.error).toBe("Falha ao atualizar");
  });

  it("should handle error in removeNote", async () => {
    vi.mocked(notesRepo.deleteNote).mockRejectedValueOnce(new Error("Falha ao deletar"));
    const { result } = renderHook(() => useNotes("user-123"));

    await act(async () => {
      try {
        await result.current.removeNote("n1");
      } catch {
        // Erro esperado
      }
    });

    expect(result.current.syncStatus).toBe("error");
    expect(result.current.error).toBe("Falha ao deletar");
  });
});
