import type { NoteDocument } from "@/types/note";

/**
 * Filtra notas em memória por consulta textual (case-insensitive) e interseção de tags (AND).
 */
export function filterNotes(
  notes: NoteDocument[],
  query: string,
  selectedTags: string[]
): NoteDocument[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSelectedTags = selectedTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);

  if (!normalizedQuery && normalizedSelectedTags.length === 0) {
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

    return matchesQuery && matchesTags;
  });
}
