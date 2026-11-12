import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NoteList } from "@/components/NoteList";
import type { NoteDocument } from "@/types/note";

describe("NoteList", () => {
  it("should show empty state when notes list is empty without active filters", () => {
    render(
      <NoteList
        notes={[]}
        hasFilter={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTagClick={vi.fn()}
      />
    );

    expect(screen.getByText("Seu diário está em branco")).toBeInTheDocument();
  });

  it("should show no results message when notes list is empty with active filter", () => {
    render(
      <NoteList
        notes={[]}
        hasFilter={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTagClick={vi.fn()}
      />
    );

    expect(screen.getByText("Nenhuma anotação encontrada")).toBeInTheDocument();
  });

  it("should render list of note cards when notes are present", () => {
    const mockNotes: NoteDocument[] = [
      {
        id: "1",
        text: "Primeira anotação",
        tags: ["tag1"],
        createdAt: 1000,
        updatedAt: 1000,
        userId: "user-1",
      },
      {
        id: "2",
        text: "Segunda anotação",
        tags: ["tag2"],
        createdAt: 2000,
        updatedAt: 2000,
        userId: "user-1",
      },
    ];

    render(
      <NoteList
        notes={mockNotes}
        hasFilter={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTagClick={vi.fn()}
      />
    );

    expect(screen.getByText("Primeira anotação")).toBeInTheDocument();
    expect(screen.getByText("Segunda anotação")).toBeInTheDocument();
  });
});
