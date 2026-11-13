import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteCard } from "@/components/NoteCard";
import type { NoteDocument } from "@/types/note";

describe("NoteCard", () => {
  const mockNote: NoteDocument = {
    id: "note-1",
    text: "Minha anotação especial de teste",
    tags: ["reflexao", "produtividade"],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    userId: "user-123",
  };

  it("should render note text, formatted date, and tags", () => {
    render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTagClick={vi.fn()}
      />
    );

    expect(screen.getByText("Minha anotação especial de teste")).toBeInTheDocument();
    expect(screen.getByText("#reflexao")).toBeInTheDocument();
    expect(screen.getByText("#produtividade")).toBeInTheDocument();

    const timeElement = screen.getByText((_content, element) => element?.tagName.toLowerCase() === "time");
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass("font-bold");
  });

  it("should trigger onTagClick when a tag pill is clicked", () => {
    const handleTagClick = vi.fn();
    render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTagClick={handleTagClick}
      />
    );

    fireEvent.click(screen.getByText("#reflexao"));
    expect(handleTagClick).toHaveBeenCalledWith("reflexao");
  });

  it("should trigger onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn();
    render(
      <NoteCard
        note={mockNote}
        onEdit={handleEdit}
        onDelete={vi.fn()}
        onTagClick={vi.fn()}
      />
    );

    const editBtn = screen.getByTitle("Editar anotação");
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockNote);
  });

  it("should trigger onDelete after confirm dialog", () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const handleDelete = vi.fn();

    render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={handleDelete}
        onTagClick={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle("Excluir anotação");
    fireEvent.click(deleteBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(handleDelete).toHaveBeenCalledWith("note-1");
  });
});
