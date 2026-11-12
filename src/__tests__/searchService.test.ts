import { describe, it, expect } from "vitest";
import { filterNotes } from "@/services/searchService";
import type { NoteDocument } from "@/types/note";

describe("searchService - filterNotes", () => {
  const sampleNotes: NoteDocument[] = [
    {
      id: "note-1",
      text: "Corrida matinal de 5km no parque",
      tags: ["esporte", "saude"],
      createdAt: 1000,
      updatedAt: 1000,
      userId: "user-123",
    },
    {
      id: "note-2",
      text: "Aula de React e TypeScript avançado",
      tags: ["estudo", "programacao"],
      createdAt: 2000,
      updatedAt: 2000,
      userId: "user-123",
    },
    {
      id: "note-3",
      text: "Planejamento da viagem para a praia",
      tags: ["viagem", "lazer"],
      createdAt: 3000,
      updatedAt: 3000,
      userId: "user-123",
    },
    {
      id: "note-4",
      text: "Consulta médica e exame de rotina para saúde",
      tags: ["saude"],
      createdAt: 4000,
      updatedAt: 4000,
      userId: "user-123",
    },
  ];

  it("should return all notes when query is empty and no tags are selected", () => {
    const result = filterNotes(sampleNotes, "", []);
    expect(result).toHaveLength(4);
    expect(result).toEqual(sampleNotes);
  });

  it("should filter notes by case-insensitive text query", () => {
    const result = filterNotes(sampleNotes, "corrida", []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("note-1");

    const resultUppercase = filterNotes(sampleNotes, "REACT", []);
    expect(resultUppercase).toHaveLength(1);
    expect(resultUppercase[0].id).toBe("note-2");
  });

  it("should filter notes by selected tags (AND intersection)", () => {
    const result = filterNotes(sampleNotes, "", ["saude"]);
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(["note-1", "note-4"]);

    const resultMultiple = filterNotes(sampleNotes, "", ["saude", "esporte"]);
    expect(resultMultiple).toHaveLength(1);
    expect(resultMultiple[0].id).toBe("note-1");

    const resultNoMatch = filterNotes(sampleNotes, "", ["saude", "viagem"]);
    expect(resultNoMatch).toHaveLength(0);
  });

  it("should combine text query and tag filtering simultaneously", () => {
    const result = filterNotes(sampleNotes, "exame", ["saude"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("note-4");

    const resultMismatch = filterNotes(sampleNotes, "praia", ["saude"]);
    expect(resultMismatch).toHaveLength(0);
  });

  it("should handle edge cases with empty notes array or whitespace query", () => {
    expect(filterNotes([], "teste", [])).toEqual([]);
    expect(filterNotes(sampleNotes, "   ", [])).toHaveLength(4);
  });
});
