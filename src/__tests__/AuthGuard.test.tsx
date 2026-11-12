import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthGuard } from "@/components/AuthGuard";
import type { User } from "firebase/auth";

describe("AuthGuard", () => {
  it("should display loading indicator when loading is true", () => {
    render(
      <AuthGuard
        loading={true}
        isAuthorized={false}
        user={null}
        error={null}
        onLogin={vi.fn()}
      >
        <div>Conteúdo Protegido</div>
      </AuthGuard>
    );

    expect(screen.getByText("Carregando Moleskine...")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo Protegido")).not.toBeInTheDocument();
  });

  it("should show login screen when user is not authorized", () => {
    const handleLogin = vi.fn();
    render(
      <AuthGuard
        loading={false}
        isAuthorized={false}
        user={null}
        error="Acesso negado: Este diário é privado."
        onLogin={handleLogin}
      >
        <div>Conteúdo Protegido</div>
      </AuthGuard>
    );

    expect(screen.getByText("Moleskine")).toBeInTheDocument();
    expect(screen.getByText("Acesso negado: Este diário é privado.")).toBeInTheDocument();

    const loginButton = screen.getByRole("button", { name: /entrar com google/i });
    expect(loginButton).toBeInTheDocument();

    fireEvent.click(loginButton);
    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Conteúdo Protegido")).not.toBeInTheDocument();
  });

  it("should render children when user is authorized", () => {
    render(
      <AuthGuard
        loading={false}
        isAuthorized={true}
        user={{ uid: "author-uid" } as unknown as User}
        error={null}
        onLogin={vi.fn()}
      >
        <div>Conteúdo Protegido</div>
      </AuthGuard>
    );

    expect(screen.getByText("Conteúdo Protegido")).toBeInTheDocument();
    expect(screen.queryByText("Carregando Moleskine...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /entrar com google/i })).not.toBeInTheDocument();
  });
});
