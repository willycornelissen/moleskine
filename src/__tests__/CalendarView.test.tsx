import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarView } from "@/components/CalendarView";
import type { NoteDocument } from "@/types/note";

describe("CalendarView", () => {
  const noteDate1 = new Date(2026, 10, 12, 10, 0, 0).getTime(); // 12 Nov 2026
  const noteDate2 = new Date(2026, 10, 12, 14, 0, 0).getTime(); // 12 Nov 2026
  const noteDate3 = new Date(2026, 10, 20, 10, 0, 0).getTime(); // 20 Nov 2026

  const mockNotes: NoteDocument[] = [
    {
      id: "n1",
      text: "Nota 1",
      tags: [],
      createdAt: noteDate1,
      updatedAt: noteDate1,
      userId: "u1",
    },
    {
      id: "n2",
      text: "Nota 2",
      tags: [],
      createdAt: noteDate2,
      updatedAt: noteDate2,
      userId: "u1",
    },
    {
      id: "n3",
      text: "Nota 3",
      tags: [],
      createdAt: noteDate3,
      updatedAt: noteDate3,
      userId: "u1",
    },
  ];

  it("should render month and year header and weekday labels", () => {
    render(
      <CalendarView
        notes={mockNotes}
        selectedDate="2026-11-12"
        onSelectDate={vi.fn()}
      />
    );

    expect(screen.getByText("Novembro de 2026")).toBeInTheDocument();
    expect(screen.getByText("Dom")).toBeInTheDocument();
    expect(screen.getByText("Seg")).toBeInTheDocument();
    expect(screen.getByText("Sáb")).toBeInTheDocument();
  });

  it("should show indicators for days with notes", () => {
    render(
      <CalendarView
        notes={mockNotes}
        selectedDate={null}
        initialYear={2026}
        initialMonth={10}
        onSelectDate={vi.fn()}
      />
    );

    // Day 12 button
    const day12Btn = screen.getByRole("button", { name: /12 de Novembro/i });
    expect(day12Btn).toBeInTheDocument();
    expect(day12Btn).toHaveAttribute("data-has-notes", "true");
    expect(day12Btn).toHaveAttribute("data-notes-count", "2");

    // Day 20 button
    const day20Btn = screen.getByRole("button", { name: /20 de Novembro/i });
    expect(day20Btn).toHaveAttribute("data-has-notes", "true");
    expect(day20Btn).toHaveAttribute("data-notes-count", "1");
  });

  it("should call onSelectDate when a day is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <CalendarView
        notes={mockNotes}
        selectedDate={null}
        initialYear={2026}
        initialMonth={10}
        onSelectDate={handleSelect}
      />
    );

    const day12Btn = screen.getByRole("button", { name: /12 de Novembro/i });
    fireEvent.click(day12Btn);

    expect(handleSelect).toHaveBeenCalledWith("2026-11-12");
  });

  it("should toggle off selected date when clicked again", () => {
    const handleSelect = vi.fn();
    render(
      <CalendarView
        notes={mockNotes}
        selectedDate="2026-11-12"
        initialYear={2026}
        initialMonth={10}
        onSelectDate={handleSelect}
      />
    );

    const day12Btn = screen.getByRole("button", { name: /12 de Novembro/i });
    fireEvent.click(day12Btn);

    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it("should navigate through months and years", () => {
    render(
      <CalendarView
        notes={mockNotes}
        selectedDate={null}
        initialYear={2026}
        initialMonth={10} // Nov 2026
        onSelectDate={vi.fn()}
      />
    );

    expect(screen.getByText("Novembro de 2026")).toBeInTheDocument();

    // Next month
    fireEvent.click(screen.getByRole("button", { name: /mês seguinte/i }));
    expect(screen.getByText("Dezembro de 2026")).toBeInTheDocument();

    // Previous month
    fireEvent.click(screen.getByRole("button", { name: /mês anterior/i }));
    expect(screen.getByText("Novembro de 2026")).toBeInTheDocument();

    // Next year
    fireEvent.click(screen.getByRole("button", { name: /ano seguinte/i }));
    expect(screen.getByText("Novembro de 2027")).toBeInTheDocument();

    // Previous year
    fireEvent.click(screen.getByRole("button", { name: /ano anterior/i }));
    expect(screen.getByText("Novembro de 2026")).toBeInTheDocument();
  });

  it("should reset to current month and year when clicking 'Hoje'", () => {
    render(
      <CalendarView
        notes={mockNotes}
        selectedDate={null}
        initialYear={2020}
        initialMonth={0} // Jan 2020
        onSelectDate={vi.fn()}
      />
    );

    expect(screen.getByText("Janeiro de 2020")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hoje/i }));

    const now = new Date();
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const expectedLabel = `${months[now.getMonth()]} de ${now.getFullYear()}`;
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it("should show clear filter button when a date is selected and call onSelectDate(null)", () => {
    const handleSelect = vi.fn();
    render(
      <CalendarView
        notes={mockNotes}
        selectedDate="2026-11-12"
        initialYear={2026}
        initialMonth={10}
        onSelectDate={handleSelect}
      />
    );

    const clearBtn = screen.getByRole("button", { name: /limpar filtro de data/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(handleSelect).toHaveBeenCalledWith(null);
  });
});
