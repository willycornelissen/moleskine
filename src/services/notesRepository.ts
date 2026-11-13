import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  type CollectionReference,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { NoteDocument } from "@/types/note";

/**
 * Retorna a referência da subcoleção de notas do usuário autenticado (/users/{userId}/notes).
 */
export function getUserNotesCollection(userId: string): CollectionReference<DocumentData> {
  if (!userId) {
    throw new Error("Identificador de usuário (userId) obrigatório.");
  }
  return collection(db, "users", userId, "notes");
}

/**
 * Normaliza array de tags em caixa baixa e remove espaços vazios.
 */
export function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)));
}

export interface SnapshotMeta {
  hasPendingWrites: boolean;
  fromCache: boolean;
}

/**
 * Assina as notas mais recentes do usuário (/users/{userId}/notes), ordenadas por updatedAt decrescente.
 * Aplica limite de segurança (default: 200) para proteção contra estouro de cota do Spark plan.
 */
export function subscribeRecentNotes(
  userId: string,
  onUpdate: (notes: NoteDocument[], meta?: SnapshotMeta) => void,
  onError?: (error: Error) => void,
  limitCount: number = 200
): () => void {
  const notesRef = getUserNotesCollection(userId);
  const q = query(notesRef, orderBy("updatedAt", "desc"), limit(limitCount));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const notes: NoteDocument[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text || "",
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
          userId: data.userId || userId,
        };
      });
      onUpdate(notes, {
        hasPendingWrites: Boolean(snapshot.metadata?.hasPendingWrites),
        fromCache: Boolean(snapshot.metadata?.fromCache),
      });
    },
    (err) => {
      if (onError) {
        onError(err);
      }
    }
  );
}

/**
 * Cria uma nova nota com ID síncrono offline gerado pelo Firestore.
 */
export async function createNote(
  userId: string,
  text: string,
  tags: string[]
): Promise<string> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error("O conteúdo da nota não pode estar vazio.");
  }

  const notesRef = getUserNotesCollection(userId);
  const docRef = doc(notesRef);
  const now = Date.now();

  const newNote: NoteDocument = {
    id: docRef.id,
    text: trimmedText,
    tags: normalizeTags(tags),
    createdAt: now,
    updatedAt: now,
    userId,
  };

  await setDoc(docRef, newNote);
  return docRef.id;
}

/**
 * Atualiza o texto e tags de uma nota existente e atualiza o timestamp updatedAt.
 */
export async function updateNote(
  userId: string,
  noteId: string,
  text: string,
  tags: string[]
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error("O conteúdo da nota não pode estar vazio.");
  }
  if (!noteId) {
    throw new Error("Identificador da nota (noteId) obrigatório.");
  }

  const notesRef = getUserNotesCollection(userId);
  const docRef = doc(notesRef, noteId);

  await updateDoc(docRef, {
    text: trimmedText,
    tags: normalizeTags(tags),
    updatedAt: Date.now(),
  });
}

/**
 * Exclui uma nota do Firestore.
 */
export async function deleteNote(userId: string, noteId: string): Promise<void> {
  if (!noteId) {
    throw new Error("Identificador da nota (noteId) obrigatório.");
  }

  const notesRef = getUserNotesCollection(userId);
  const docRef = doc(notesRef, noteId);
  await deleteDoc(docRef);
}
