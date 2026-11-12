import { useMemo } from "react";
import type { NoteDocument, NoteFilterCriteria } from "@/types/note";
import { filterNotes } from "@/services/searchService";

/**
 * Hook para filtragem em memória ultra-rápida (<6ms para 10k notas)
 * combinando busca textual e tag ativa.
 */
export function useSearch(
  notes: NoteDocument[],
  criteria: NoteFilterCriteria
): NoteDocument[] {
  return useMemo(() => {
    const query = criteria.query ?? criteria.searchQuery ?? "";
    const selectedTags = criteria.tag
      ? [criteria.tag]
      : criteria.selectedTags ?? [];
    return filterNotes(notes, query, selectedTags, criteria.selectedDate);
  }, [
    notes,
    criteria.query,
    criteria.searchQuery,
    criteria.tag,
    criteria.selectedTags,
    criteria.selectedDate,
  ]);
}
