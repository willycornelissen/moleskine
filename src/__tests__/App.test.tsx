import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "@/App";
import * as useAuthHook from "@/hooks/useAuth";
import * as useNotesHook from "@/hooks/useNotes";
import type { User } from "firebase/auth";

vi.mock("@/hooks/useAuth");
vi.mock("@/hooks/useNotes");

describe("App (SPA Integration)", () => {
  const mockUser = {
    uid: "test-user-id",
    displayName: "Autor",
    email: "autor@test.com",
  };

  const mockNotes = [
    {
      id: "n1",
      text: "Minha primeira reflexão do diário",
      tags: ["diario", "reflexao"],
      createdAt: 1000,
      updatedAt: 1000,
      userId: "test-user-id",
    },
  ];

  const mockAddNote = vi.fn().mockResolvedValue("new-id");
  const mockEditNote = vi.fn().mockResolvedValue(undefined);
  const mockRemoveNote = vi.fn().mockResolvedValue(undefined);
  const mockLogout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: mockUser as unknown as User,
      loading: false,
      isAuthorized: true,
      error: null,
      signInWithGoogle: vi.fn(),
      logout: mockLogout,
    });

    vi.mocked(useNotesHook.useNotes).mockReturnValue({
      notes: mockNotes,
      loading: false,
      syncStatus: "synced",
      error: null,
      isOnline: true,
      addNote: mockAddNote,
      editNote: mockEditNote,
      removeNote: mockRemoveNote,
    });
  });

  it("should render full application layout for authorized user", () => {
    render(<App />);

    expect(screen.getByText("Moleskine")).toBeInTheDocument();
    expect(screen.getByText("Minha primeira reflexão do diário")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/O que você está pensando hoje/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar no diário...")).toBeInTheDocument();
  });

  it("should handle creating a new note from the editor", async () => {
    render(<App />);

    const textarea = screen.getByPlaceholderText(/O que você está pensando hoje/i);
    fireEvent.change(textarea, { target: { value: "Anotação rápida no App" } });

    const submitBtn = screen.getByRole("button", { name: /Anotar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddNote).toHaveBeenCalledWith("Anotação rápida no App", []);
    });
  });

  it("should open backup modal when clicking backup button", () => {
    render(<App />);

    const backupBtn = screen.getByTitle("Exportar backup dos dados");
    fireEvent.click(backupBtn);

    expect(screen.getByText("Backup do Diário")).toBeInTheDocument();
  });

  it("should show loading indicator when notesLoading is true", () => {
    vi.mocked(useNotesHook.useNotes).mockReturnValueOnce({
      notes: [],
      loading: true,
      syncStatus: "syncing",
      error: null,
      isOnline: true,
      addNote: mockAddNote,
      editNote: mockEditNote,
      removeNote: mockRemoveNote,
    });

    render(<App />);
    expect(screen.getByText("Sincronizando suas notas...")).toBeInTheDocument();
  });

  it("should display notesError message if present", () => {
    vi.mocked(useNotesHook.useNotes).mockReturnValueOnce({
      notes: [],
      loading: false,
      syncStatus: "error",
      error: "Falha de rede com Firestore",
      isOnline: false,
      addNote: mockAddNote,
      editNote: mockEditNote,
      removeNote: mockRemoveNote,
    });

    render(<App />);
    expect(screen.getByText("Falha de rede com Firestore")).toBeInTheDocument();
  });

  it("should handle edit note and cancellation", async () => {
    render(<App />);

    const editBtn = screen.getByTitle("Editar anotação");
    fireEvent.click(editBtn);

    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Atualizar/i })).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole("button", { name: /Cancelar/i })).not.toBeInTheDocument();
  });

  it("should toggle calendar view when clicking calendar button in search bar", () => {
    render(<App />);

    expect(screen.queryByText(/dias com notas/i)).not.toBeInTheDocument();

    const calendarToggleBtn = screen.getByRole("button", { name: "Exibir calendário" });
    fireEvent.click(calendarToggleBtn);

    expect(screen.getByText(/dias com notas/i)).toBeInTheDocument();

    fireEvent.click(calendarToggleBtn);
    expect(screen.queryByText(/dias com notas/i)).not.toBeInTheDocument();
  });
});
