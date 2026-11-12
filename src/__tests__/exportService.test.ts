import { describe, it, expect } from "vitest";
import { exportToJson, formatNoteToMarkdown, exportToMarkdownZip } from "@/services/exportService";
import type { NoteDocument } from "@/types/note";

describe("exportService", () => {
  const sampleNotes: NoteDocument[] = [
    {
      id: "note-abc-123",
      text: "Primeira reflexão do dia sobre foco e produtividade",
      tags: ["produtividade", "rotina"],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      userId: "user-test",
    },
    {
      id: "note-def-456",
      text: "Corrida de rua",
      tags: ["esporte"],
      createdAt: 1700001000000,
      updatedAt: 1700002000000,
      userId: "user-test",
    },
  ];

  it("exportToJson should produce valid formatted JSON containing all notes", () => {
    const jsonString = exportToJson(sampleNotes);
    expect(typeof jsonString).toBe("string");

    const parsed = JSON.parse(jsonString);
    expect(parsed.totalNotes).toBe(2);
    expect(parsed.notes).toHaveLength(2);
    expect(parsed.notes[0].id).toBe("note-abc-123");
  });

  it("formatNoteToMarkdown should include YAML frontmatter with id, dates and tags", () => {
    const md = formatNoteToMarkdown(sampleNotes[0]);
    expect(md).toContain('id: "note-abc-123"');
    expect(md).toContain('  - "produtividade"');
    expect(md).toContain('  - "rotina"');
    expect(md).toContain("Primeira reflexão do dia sobre foco e produtividade");
  });

  it("formatNoteToMarkdown should handle empty tags gracefully", () => {
    const noteWithoutTags: NoteDocument = {
      ...sampleNotes[0],
      tags: [],
    };
    const md = formatNoteToMarkdown(noteWithoutTags);
    expect(md).toContain("tags:\n  []");
  });

  it("exportToMarkdownZip should dynamically import JSZip and generate a Blob", async () => {
    const blob = await exportToMarkdownZip(sampleNotes);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  }, 15000);
});
