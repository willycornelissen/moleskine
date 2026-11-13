import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserNotesCollection,
  normalizeTags,
  createNote,
  updateNote,
  deleteNote,
  subscribeRecentNotes,
} from "@/services/notesRepository";
import * as firestore from "firebase/firestore";

vi.mock("@/services/firebase", () => ({
  db: { _mockDb: true },
}));

vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn((_db, ...paths) => ({ path: paths.join("/") })),
    doc: vi.fn((collRef, id) => ({
      path: id ? `${collRef.path}/${id}` : `${collRef.path}/mock-auto-id-123`,
      id: id || "mock-auto-id-123",
    })),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    query: vi.fn((ref) => ref),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn((_q, optionsOrCallback, maybeCallback) => {
      const callback =
        typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
      callback?.({
        docs: [
          {
            id: "doc-1",
            data: () => ({
              text: "Nota 1",
              tags: ["tag1"],
              createdAt: 1000,
              updatedAt: 2000,
              userId: "user-test",
            }),
          },
        ],
        metadata: {
          hasPendingWrites: false,
          fromCache: false,
        },
      });
      return vi.fn(); // Unsubscribe mock
    }),
  };
});

describe("notesRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserNotesCollection", () => {
    it("should return collection reference for the given user", () => {
      const coll = getUserNotesCollection("user-123");
      expect(coll.path).toBe("users/user-123/notes");
      expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), "users", "user-123", "notes");
    });

    it("should throw if userId is empty", () => {
      expect(() => getUserNotesCollection("")).toThrow("Identificador de usuário (userId) obrigatório.");
    });
  });

  describe("normalizeTags", () => {
    it("should convert tags to lowercase, trim spaces and deduplicate", () => {
      const result = normalizeTags([" Saúde ", "saúde", "Esporte", "", "   ", "ESPORTE"]);
      expect(result).toEqual(["saúde", "esporte"]);
    });
  });

  describe("subscribeRecentNotes", () => {
    it("should create query with limit 200, enable includeMetadataChanges and invoke callback with mapped notes", () => {
      const onUpdate = vi.fn();
      const unsubscribe = subscribeRecentNotes("user-123", onUpdate);

      expect(firestore.orderBy).toHaveBeenCalledWith("updatedAt", "desc");
      expect(firestore.limit).toHaveBeenCalledWith(200);
      expect(firestore.onSnapshot).toHaveBeenCalledWith(
        expect.anything(),
        { includeMetadataChanges: true },
        expect.any(Function),
        expect.any(Function)
      );
      expect(onUpdate).toHaveBeenCalledWith(
        [
          {
            id: "doc-1",
            text: "Nota 1",
            tags: ["tag1"],
            createdAt: 1000,
            updatedAt: 2000,
            userId: "user-test",
          },
        ],
        expect.objectContaining({
          hasPendingWrites: false,
          fromCache: false,
        })
      );
      expect(typeof unsubscribe).toBe("function");
    });
  });

  describe("createNote", () => {
    it("should reject empty text or empty userId", async () => {
      await expect(createNote("user-123", "   ", ["tag"])).rejects.toThrow(
        "O conteúdo da nota não pode estar vazio."
      );
      await expect(createNote("", "Texto", ["tag"])).rejects.toThrow();
    });

    it("should create note with auto ID and normalized tags", async () => {
      const id = await createNote("user-123", "Minha nova nota", ["Saúde", "Esporte"]);

      expect(id).toBe("mock-auto-id-123");
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mock-auto-id-123" }),
        expect.objectContaining({
          id: "mock-auto-id-123",
          text: "Minha nova nota",
          tags: ["saúde", "esporte"],
          userId: "user-123",
        })
      );
    });
  });

  describe("updateNote", () => {
    it("should reject empty text, empty noteId or empty userId", async () => {
      await expect(updateNote("user-123", "doc-1", "", [])).rejects.toThrow();
      await expect(updateNote("user-123", "", "Texto", [])).rejects.toThrow();
      await expect(updateNote("", "doc-1", "Texto", [])).rejects.toThrow();
    });

    it("should update note document and updatedAt timestamp", async () => {
      await updateNote("user-123", "doc-1", "Texto atualizado", [" NovaTag "]);

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "doc-1" }),
        expect.objectContaining({
          text: "Texto atualizado",
          tags: ["novatag"],
          updatedAt: expect.any(Number),
        })
      );
    });
  });

  describe("deleteNote", () => {
    it("should reject empty noteId or empty userId", async () => {
      await expect(deleteNote("user-123", "")).rejects.toThrow();
      await expect(deleteNote("", "doc-1")).rejects.toThrow();
    });

    it("should call deleteDoc with correct doc reference", async () => {
      await deleteNote("user-123", "doc-1");
      expect(firestore.deleteDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "doc-1" })
      );
    });
  });
});
