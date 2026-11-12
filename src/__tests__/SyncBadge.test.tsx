import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyncBadge } from "@/components/SyncBadge";

describe("SyncBadge", () => {
  it("should render Synced status correctly", () => {
    render(<SyncBadge status="synced" />);
    expect(screen.getByText("Sincronizado")).toBeInTheDocument();
  });

  it("should render Syncing status correctly", () => {
    render(<SyncBadge status="syncing" />);
    expect(screen.getByText("Sincronizando...")).toBeInTheDocument();
  });

  it("should render Offline status correctly", () => {
    render(<SyncBadge status="offline" />);
    expect(screen.getByText("Modo Offline")).toBeInTheDocument();
  });

  it("should render Error status correctly", () => {
    render(<SyncBadge status="error" />);
    expect(screen.getByText("Erro de sincronização")).toBeInTheDocument();
  });
});
