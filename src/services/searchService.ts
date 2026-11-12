import type { NoteDocument } from "@/types/note";
import { toDateKey } from "@/services/calendarService";

/**
 * Filtra notas em memória por consulta textual (case-insensitive), interseção de tags (AND)
 * e data de criação específica (YYYY-MM-DD).
 */
export function filterNotes(
  notes: NoteDocument[],
  query: string,
  selectedTags: string[],
  selectedDate?: string | null
): NoteDocument[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSelectedTags = selectedTags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  if (!normalizedQuery && normalizedSelectedTags.length === 0 && !selectedDate) {
    return notes;
  }

  return notes.filter((note) => {
    const matchesQuery =
      !normalizedQuery || note.text.toLowerCase().includes(normalizedQuery);

    const matchesTags =
      normalizedSelectedTags.length === 0 ||
      normalizedSelectedTags.every((selectedTag) =>
        note.tags.some((noteTag) => noteTag.toLowerCase() === selectedTag)
      );

    const matchesDate =
      !selectedDate || toDateKey(note.createdAt) === selectedDate;

    return matchesQuery && matchesTags && matchesDate;
  });
}
