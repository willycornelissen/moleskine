import type { NoteDocument } from "@/types/note";

/**
 * Serializa a lista de notas para uma string JSON formatada.
 */
export function exportToJson(notes: NoteDocument[]): string {
  return JSON.stringify(
    {
      version: "1.0",
      exportDate: new Date().toISOString(),
      totalNotes: notes.length,
      notes,
    },
    null,
    2
  );
}

/**
 * Formata uma nota individual no padrão Markdown com frontmatter YAML.
 */
export function formatNoteToMarkdown(note: NoteDocument): string {
  const isoDate = new Date(note.createdAt).toISOString();
  const tagsYaml = note.tags.map((tag) => `  - "${tag}"`).join("\n");

  return `---
id: "${note.id}"
createdAt: "${isoDate}"
updatedAt: "${new Date(note.updatedAt).toISOString()}"
tags:
${tagsYaml || "  []"}
---

${note.text}
`;
}

/**
 * Empacota todas as notas em arquivos Markdown individuais dentro de um arquivo ZIP.
 * Carrega a biblioteca JSZip dinamicamente sob demanda para proteger o bundle inicial.
 */
export async function exportToMarkdownZip(notes: NoteDocument[]): Promise<Blob> {
  const JSZipModule = await import("jszip");
  const JSZip = JSZipModule.default || JSZipModule;
  const zip = new JSZip();

  notes.forEach((note, index) => {
    // Sanitiza nome do arquivo a partir dos primeiros caracteres ou índice/id
    const safeSnippet = note.text
      .slice(0, 30)
      .trim()
      .replace(/[\\/*?:"<>|]/g, "_")
      .replace(/\s+/g, "_") || `nota_${index + 1}`;

    const filename = `${note.id.slice(0, 8)}_${safeSnippet}.md`;
    zip.file(filename, formatNoteToMarkdown(note));
  });

  return zip.generateAsync({ type: "blob" });
}
