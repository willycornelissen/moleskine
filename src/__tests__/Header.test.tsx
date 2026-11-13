import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/Header";
import type { User } from "firebase/auth";

describe("Header", () => {
  it("should render application title, sync status and actions", () => {
    const handleOpenBackup = vi.fn();
    const handleLogout = vi.fn();
    const mockUser = {
      displayName: "Willy",
      email: "willy@example.com",
      photoURL: "https://example.com/photo.jpg",
    } as unknown as User;

    render(
      <Header
        user={mockUser}
        syncStatus="synced"
        onOpenBackup={handleOpenBackup}
        onLogout={handleLogout}
      />
    );

    expect(screen.getByText("Moleskine")).toBeInTheDocument();
    expect(screen.getByText("Diário Pessoal de Notas")).toBeInTheDocument();
    expect(screen.getByText("Sincronizado")).toBeInTheDocument();

    const backupBtn = screen.getByTitle("Exportar backup dos dados");
    fireEvent.click(backupBtn);
    expect(handleOpenBackup).toHaveBeenCalledTimes(1);

    const logoutBtn = screen.getByTitle("Sair da conta");
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("should render avatar initial fallback when photoURL is null", () => {
    const mockUser = {
      displayName: "Carlos",
      email: "carlos@example.com",
      photoURL: null,
    } as unknown as User;

    render(
      <Header
        user={mockUser}
        syncStatus="offline"
        onOpenBackup={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText("C")).toBeInTheDocument();
  });
});
