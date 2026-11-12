import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BackupModal } from "@/components/BackupModal";
import type { NoteDocument } from "@/types/note";
import * as exportService from "@/services/exportService";

vi.mock("@/services/exportService", () => ({
  exportToJson: vi.fn(() => JSON.stringify([{ id: "1" }])),
  exportToMarkdownZip: vi.fn(() => Promise.resolve(new Blob(["mock-zip"]))),
}));

describe("BackupModal", () => {
  const mockNotes: NoteDocument[] = [
    {
      id: "1",
      text: "Nota para backup",
      tags: ["backup"],
      createdAt: 1000,
      updatedAt: 1000,
      userId: "user-1",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <BackupModal isOpen={false} onClose={vi.fn()} notes={mockNotes} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render modal when isOpen is true and handle JSON export", () => {
    const handleClose = vi.fn();

    render(
      <BackupModal isOpen={true} onClose={handleClose} notes={mockNotes} />
    );

    expect(screen.getByText("Backup do Diário")).toBeInTheDocument();
    expect(screen.getByText(/1 anotações/i)).toBeInTheDocument();

    const jsonBtn = screen.getByText("Exportar como JSON");
    fireEvent.click(jsonBtn);

    expect(exportService.exportToJson).toHaveBeenCalledWith(mockNotes);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it("should handle ZIP Markdown export", async () => {
    render(
      <BackupModal isOpen={true} onClose={vi.fn()} notes={mockNotes} />
    );

    const zipBtn = screen.getByText("Exportar ZIP com Markdown");
    fireEvent.click(zipBtn);

    await waitFor(() => {
      expect(exportService.exportToMarkdownZip).toHaveBeenCalledWith(mockNotes);
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("should trigger onClose when close button is clicked", () => {
    const handleClose = vi.fn();

    render(
      <BackupModal isOpen={true} onClose={handleClose} notes={mockNotes} />
    );

    const closeBtn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
