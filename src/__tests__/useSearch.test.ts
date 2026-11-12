import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSearch } from "@/hooks/useSearch";
import type { NoteDocument } from "@/types/note";

describe("useSearch", () => {
  const mockNotes: NoteDocument[] = [
    {
      id: "1",
      text: "Primeira nota sobre arquitetura e design",
      tags: ["arquitetura", "design"],
      createdAt: 1000,
      updatedAt: 1000,
      userId: "user-1",
    },
    {
      id: "2",
      text: "Segunda nota com reflexões de produtividade",
      tags: ["produtividade"],
      createdAt: 2000,
      updatedAt: 2000,
      userId: "user-1",
    },
    {
      id: "3",
      text: "Terceira nota sobre testes automatizados",
      tags: ["testes", "qualidade"],
      createdAt: 3000,
      updatedAt: 3000,
      userId: "user-1",
    },
  ];

  it("should return all notes when filter criteria is empty", () => {
    const { result } = renderHook(() =>
      useSearch(mockNotes, { query: "", tag: null })
    );

    expect(result.current).toHaveLength(3);
  });

  it("should filter notes by query text", () => {
    const { result } = renderHook(() =>
      useSearch(mockNotes, { query: "reflexões", tag: null })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("2");
  });

  it("should filter notes by tag", () => {
    const { result } = renderHook(() =>
      useSearch(mockNotes, { query: "", tag: "testes" })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("3");
  });

  it("should filter by combined query and tag", () => {
    const { result } = renderHook(() =>
      useSearch(mockNotes, { query: "arquitetura", tag: "design" })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("1");

    const { result: emptyResult } = renderHook(() =>
      useSearch(mockNotes, { query: "arquitetura", tag: "testes" })
    );

    expect(emptyResult.current).toHaveLength(0);
  });

  it("should filter by selectedDate", () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const notesWithToday: NoteDocument[] = [
      {
        id: "dated-1",
        text: "Nota de hoje",
        tags: ["hoje"],
        createdAt: today.getTime(),
        updatedAt: today.getTime(),
        userId: "user-1",
      },
      ...mockNotes,
    ];

    const { result } = renderHook(() =>
      useSearch(notesWithToday, { selectedDate: todayKey })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("dated-1");
  });
});
