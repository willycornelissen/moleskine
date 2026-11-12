import { useState, useEffect, useCallback, useRef } from "react";
import type { NoteDocument, SyncStatus } from "@/types/note";
import {
  subscribeRecentNotes,
  createNote,
  updateNote,
  deleteNote,
  type SnapshotMeta,
} from "@/services/notesRepository";

export interface UseNotesReturn {
  notes: NoteDocument[];
  loading: boolean;
  syncStatus: SyncStatus;
  error: string | null;
  isOnline: boolean;
  addNote: (text: string, tags: string[]) => Promise<string>;
  editNote: (noteId: string, text: string, tags: string[]) => Promise<void>;
  removeNote: (noteId: string) => Promise<void>;
}

export function useNotes(userId: string | undefined): UseNotesReturn {
  const [notes, setNotes] = useState<NoteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const pendingWritesRef = useRef(false);

  // Monitora conectividade de rede do navegador
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus(pendingWritesRef.current ? "syncing" : "synced");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Assina notas do Firestore
  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeRecentNotes(
      userId,
      (fetchedNotes, meta?: SnapshotMeta) => {
        setNotes(fetchedNotes);
        setLoading(false);

        const hasPending = Boolean(meta?.hasPendingWrites);
        pendingWritesRef.current = hasPending;

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setSyncStatus("offline");
        } else if (hasPending) {
          setSyncStatus("syncing");
        } else {
          setSyncStatus("synced");
        }
      },
      (err) => {
        setError(err.message || "Erro ao sincronizar notas.");
        setSyncStatus("error");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const addNote = useCallback(
    async (text: string, tags: string[]): Promise<string> => {
      if (!userId) throw new Error("Usuário não autenticado.");
      setError(null);
      if (isOnline) {
        setSyncStatus("syncing");
      }
      try {
        const id = await createNote(userId, text, tags);
        return id;
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        }
        setSyncStatus("error");
        throw err;
      }
    },
    [userId, isOnline]
  );

  const editNote = useCallback(
    async (noteId: string, text: string, tags: string[]): Promise<void> => {
      if (!userId) throw new Error("Usuário não autenticado.");
      setError(null);
      if (isOnline) {
        setSyncStatus("syncing");
      }
      try {
        await updateNote(userId, noteId, text, tags);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        }
        setSyncStatus("error");
        throw err;
      }
    },
    [userId, isOnline]
  );

  const removeNote = useCallback(
    async (noteId: string): Promise<void> => {
      if (!userId) throw new Error("Usuário não autenticado.");
      setError(null);
      if (isOnline) {
        setSyncStatus("syncing");
      }
      try {
        await deleteNote(userId, noteId);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        }
        setSyncStatus("error");
        throw err;
      }
    },
    [userId, isOnline]
  );

  return {
    notes,
    loading,
    syncStatus,
    error,
    isOnline,
    addNote,
    editNote,
    removeNote,
  };
}
