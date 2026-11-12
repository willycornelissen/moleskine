import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_STORAGE_KEY = "moleskine_draft_buffer";
const DEBOUNCE_DELAY_MS = 300;

export interface DraftData {
  text: string;
  tags: string[];
}

/**
 * Hook para persistir rascunhos em tempo de digitação no localStorage com debounce de 300ms,
 * prevenindo perda de anotações caso a aba seja recarregada ou fechada.
 */
export function useDraftBuffer(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [draft, setDraftState] = useState<DraftData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignora erro de leitura
    }
    return { text: "", tags: [] };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const saveToStorage = useCallback(
    (data: DraftData) => {
      try {
        if (!data.text.trim() && data.tags.length === 0) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      } catch {
        // Ignora erro de cota de storage
      }
    },
    [storageKey]
  );

  const setDraft = useCallback(
    (data: DraftData) => {
      setDraftState(data);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        saveToStorage(data);
      }, DEBOUNCE_DELAY_MS);
    },
    [saveToStorage]
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setDraftState({ text: "", tags: [] });
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignora erro
    }
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { draft, setDraft, clearDraft };
}
