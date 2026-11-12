import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "@/components/SearchBar";

describe("SearchBar", () => {
  it("should render input and call onQueryChange when typed", () => {
    const handleQueryChange = vi.fn();
    render(
      <SearchBar
        query=""
        onQueryChange={handleQueryChange}
        activeTag={null}
        onClearTag={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText("Buscar no diário...");
    fireEvent.change(input, { target: { value: "termo" } });
    expect(handleQueryChange).toHaveBeenCalledWith("termo");
  });

  it("should show clear button when query is not empty and call onQueryChange('')", () => {
    const handleQueryChange = vi.fn();
    render(
      <SearchBar
        query="meu termo"
        onQueryChange={handleQueryChange}
        activeTag={null}
        onClearTag={vi.fn()}
      />
    );

    const clearBtn = screen.getByTitle("Limpar busca");
    fireEvent.click(clearBtn);
    expect(handleQueryChange).toHaveBeenCalledWith("");
  });

  it("should render active tag pill and call onClearTag when removed", () => {
    const handleClearTag = vi.fn();
    render(
      <SearchBar
        query=""
        onQueryChange={vi.fn()}
        activeTag="esporte"
        onClearTag={handleClearTag}
      />
    );

    expect(screen.getByText("#esporte")).toBeInTheDocument();
    const removeTagBtn = screen.getByTitle("Remover filtro de tag");
    fireEvent.click(removeTagBtn);
    expect(handleClearTag).toHaveBeenCalledTimes(1);
  });

  it("should render calendar toggle button and call onToggleCalendar when clicked", () => {
    const handleToggle = vi.fn();
    render(
      <SearchBar
        query=""
        onQueryChange={vi.fn()}
        activeTag={null}
        onClearTag={vi.fn()}
        isCalendarOpen={false}
        onToggleCalendar={handleToggle}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: "Exibir calendário" });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("should render active date pill and call onClearDate when removed", () => {
    const handleClearDate = vi.fn();
    render(
      <SearchBar
        query=""
        onQueryChange={vi.fn()}
        activeTag={null}
        onClearTag={vi.fn()}
        selectedDate="2026-11-12"
        onClearDate={handleClearDate}
      />
    );

    expect(screen.getByText("12/11/2026")).toBeInTheDocument();
    const removeDateBtn = screen.getByRole("button", { name: "Remover filtro de data" });
    fireEvent.click(removeDateBtn);
    expect(handleClearDate).toHaveBeenCalledTimes(1);
  });
});
