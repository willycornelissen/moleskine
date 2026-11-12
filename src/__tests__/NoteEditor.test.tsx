import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NoteEditor } from "@/components/NoteEditor";
import type { NoteDocument } from "@/types/note";

describe("NoteEditor", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should render editor in create mode and call onSave on submit", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(<NoteEditor onSave={handleSave} />);

    const textarea = screen.getByPlaceholderText(/O que você está pensando hoje/i);
    fireEvent.change(textarea, { target: { value: "Minha reflexão de hoje" } });

    // Adiciona tag
    const tagInput = screen.getByPlaceholderText(/Adicionar tag/i);
    fireEvent.change(tagInput, { target: { value: "ideias" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    expect(screen.getByText("#ideias")).toBeInTheDocument();

    // Remove a tag criada
    const removeBtn = screen.getByTitle("Remover tag #ideias");
    fireEvent.click(removeBtn);
    expect(screen.queryByText("#ideias")).not.toBeInTheDocument();

    // Adiciona com vírgula
    fireEvent.change(tagInput, { target: { value: "reflexao," } });
    fireEvent.keyDown(tagInput, { key: "," });

    // Salva usando atalho Ctrl+Enter no textarea
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("Minha reflexão de hoje", ["reflexao"]);
    });
  });

  it("should populate existing note when in edit mode", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleCancel = vi.fn();

    const existingNote: NoteDocument = {
      id: "note-1",
      text: "Texto da nota existente",
      tags: ["tag-antiga"],
      createdAt: 1000,
      updatedAt: 1000,
      userId: "user-1",
    };

    render(
      <NoteEditor
        editingNote={existingNote}
        onSave={handleSave}
        onCancelEdit={handleCancel}
      />
    );

    expect(screen.getByDisplayValue("Texto da nota existente")).toBeInTheDocument();
    expect(screen.getByText("#tag-antiga")).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);

    const updateBtn = screen.getByRole("button", { name: /Atualizar/i });
    fireEvent.click(updateBtn);
    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("Texto da nota existente", ["tag-antiga"]);
    });
  });
});
