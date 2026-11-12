import { describe, it, expect } from "vitest";
import {
  toDateKey,
  getNotesPerDayMap,
  formatMonthYear,
  getMonthCalendarGrid,
  WEEKDAY_LABELS,
  MONTH_NAMES,
} from "@/services/calendarService";
import type { NoteDocument } from "@/types/note";

describe("calendarService", () => {
  describe("toDateKey", () => {
    it("should format a timestamp into YYYY-MM-DD using local time", () => {
      const date = new Date(2026, 10, 12); // Nov 12, 2026
      expect(toDateKey(date.getTime())).toBe("2026-11-12");
    });

    it("should pad single digit month and day with zero", () => {
      const date = new Date(2026, 4, 5); // May 5, 2026
      expect(toDateKey(date)).toBe("2026-05-05");
    });
  });

  describe("getNotesPerDayMap", () => {
    it("should aggregate count of notes per dateKey", () => {
      const day1 = new Date(2026, 10, 12, 10, 0, 0).getTime();
      const day1Later = new Date(2026, 10, 12, 15, 30, 0).getTime();
      const day2 = new Date(2026, 10, 15, 9, 0, 0).getTime();

      const notes: NoteDocument[] = [
        {
          id: "n1",
          text: "Nota 1",
          tags: [],
          createdAt: day1,
          updatedAt: day1,
          userId: "u1",
        },
        {
          id: "n2",
          text: "Nota 2",
          tags: [],
          createdAt: day1Later,
          updatedAt: day1Later,
          userId: "u1",
        },
        {
          id: "n3",
          text: "Nota 3",
          tags: [],
          createdAt: day2,
          updatedAt: day2,
          userId: "u1",
        },
      ];

      const counts = getNotesPerDayMap(notes);
      expect(counts["2026-11-12"]).toBe(2);
      expect(counts["2026-11-15"]).toBe(1);
      expect(counts["2026-11-20"]).toBeUndefined();
    });

    it("should return empty object for empty notes array", () => {
      expect(getNotesPerDayMap([])).toEqual({});
    });
  });

  describe("formatMonthYear", () => {
    it("should return formatted month and year in Portuguese", () => {
      expect(formatMonthYear(2026, 10)).toBe("Novembro de 2026");
      expect(formatMonthYear(2025, 0)).toBe("Janeiro de 2025");
    });

    it("should expose valid month and weekday labels", () => {
      expect(MONTH_NAMES).toHaveLength(12);
      expect(WEEKDAY_LABELS).toEqual(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]);
    });
  });

  describe("getMonthCalendarGrid", () => {
    it("should generate a complete grid aligned to weekdays", () => {
      // November 2026: Nov 1st is Sunday (getDay() === 0), has 30 days
      const notesMap = {
        "2026-11-12": 3,
        "2026-11-25": 1,
      };

      const grid = getMonthCalendarGrid(2026, 10, notesMap, "2026-11-12");

      // Grid length must be a multiple of 7
      expect(grid.length % 7).toBe(0);

      // Check specific day
      const nov12 = grid.find((d) => d.dateKey === "2026-11-12");
      expect(nov12).toBeDefined();
      expect(nov12?.isCurrentMonth).toBe(true);
      expect(nov12?.isToday).toBe(true);
      expect(nov12?.notesCount).toBe(3);

      const nov25 = grid.find((d) => d.dateKey === "2026-11-25");
      expect(nov25?.notesCount).toBe(1);

      const nov1 = grid.find((d) => d.dateKey === "2026-11-01");
      expect(nov1?.isCurrentMonth).toBe(true);
      expect(nov1?.dayNumber).toBe(1);
    });

    it("should include padding days from previous and next months", () => {
      // Dec 2026: Dec 1st is Tuesday (getDay() === 2)
      // Should have 2 days from November at start
      const grid = getMonthCalendarGrid(2026, 11, {});
      expect(grid[0].isCurrentMonth).toBe(false);
      expect(grid[0].dateKey.startsWith("2026-11-")).toBe(true);

      const lastDay = grid[grid.length - 1];
      if (!lastDay.isCurrentMonth) {
        expect(lastDay.dateKey.startsWith("2027-01-")).toBe(true);
      }
    });
  });
});
