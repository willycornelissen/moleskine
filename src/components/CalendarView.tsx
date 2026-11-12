import React, { useState, useMemo } from "react";
import type { NoteDocument } from "@/types/note";
import {
  formatMonthYear,
  getMonthCalendarGrid,
  getNotesPerDayMap,
  WEEKDAY_LABELS,
  MONTH_NAMES,
  toDateKey,
} from "@/services/calendarService";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";

export interface CalendarViewProps {
  notes: NoteDocument[];
  selectedDate: string | null;
  onSelectDate: (dateKey: string | null) => void;
  initialYear?: number;
  initialMonth?: number;
  className?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  notes,
  selectedDate,
  onSelectDate,
  initialYear,
  initialMonth,
  className = "",
}) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Determine initial year and month
  const [viewYear, setViewYear] = useState<number>(() => {
    if (initialYear !== undefined) return initialYear;
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts[0]) return parseInt(parts[0], 10);
    }
    return today.getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (initialMonth !== undefined) return initialMonth;
    if (selectedDate) {
      const parts = selectedDate.split("-");
      if (parts[1]) return parseInt(parts[1], 10) - 1;
    }
    return today.getMonth();
  });

  // Calculate notes count per day map
  const notesPerDay = useMemo(() => getNotesPerDayMap(notes), [notes]);

  // Generate calendar grid
  const grid = useMemo(
    () => getMonthCalendarGrid(viewYear, viewMonth, notesPerDay, todayKey),
    [viewYear, viewMonth, notesPerDay, todayKey]
  );

  // Total notes in currently viewed month
  const totalNotesInMonth = useMemo(() => {
    return grid
      .filter((day) => day.isCurrentMonth)
      .reduce((sum, day) => sum + day.notesCount, 0);
  }, [grid]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePrevYear = () => {
    setViewYear((y) => y - 1);
  };

  const handleNextYear = () => {
    setViewYear((y) => y + 1);
  };

  const handleGoToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleDayClick = (dayDateKey: string, isCurrentMonth: boolean, date: Date) => {
    if (!isCurrentMonth) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }

    if (selectedDate === dayDateKey) {
      onSelectDate(null);
    } else {
      onSelectDate(dayDateKey);
    }
  };

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split("-");
    const monthName = MONTH_NAMES[parseInt(m, 10) - 1] || "";
    return `${d} de ${monthName} de ${y}`;
  }, [selectedDate]);

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-all mb-6 ${className}`}
    >
      {/* Calendar Header with Navigation Controls */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevYear}
            aria-label="Ano anterior"
            title="Ano anterior"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            title="Mês anterior"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-zinc-400 hidden sm:inline-block" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
            {formatMonthYear(viewYear, viewMonth)}
          </h2>
          <button
            type="button"
            onClick={handleGoToToday}
            aria-label="Hoje"
            title="Voltar para o mês atual"
            className="ml-2 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Mês seguinte"
            title="Mês seguinte"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            aria-label="Ano seguinte"
            title="Ano seguinte"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Columns Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day) => {
          const isSelected = selectedDate === day.dateKey;
          const hasNotes = day.notesCount > 0;
          const monthLabel = MONTH_NAMES[day.date.getMonth()];
          const ariaLabel = `${day.dayNumber} de ${monthLabel}${
            hasNotes ? `, ${day.notesCount} nota(s)` : ""
          }`;

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => handleDayClick(day.dateKey, day.isCurrentMonth, day.date)}
              aria-label={ariaLabel}
              data-has-notes={hasNotes ? "true" : "false"}
              data-notes-count={day.notesCount}
              className={`relative flex flex-col items-center justify-center h-10 rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold"
                  : day.isCurrentMonth
                  ? "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  : "text-zinc-400/60 dark:text-zinc-600 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
              } ${
                day.isToday && !isSelected
                  ? "ring-1 ring-zinc-400 dark:ring-zinc-600 font-bold"
                  : ""
              }`}
            >
              <span>{day.dayNumber}</span>

              {/* Indicator dot for days with notes */}
              {hasNotes && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-colors ${
                    isSelected
                      ? "bg-amber-300 dark:bg-zinc-900"
                      : "bg-emerald-500 dark:bg-emerald-400"
                  }`}
                  title={`${day.notesCount} nota(s)`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Selected Filter Info */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Dias com notas</span>
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span>
            {totalNotesInMonth} {totalNotesInMonth === 1 ? "nota" : "notas"} no mês
          </span>
        </div>

        {selectedDate && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Filtrando por {formattedSelectedDate}
            </span>
            <button
              type="button"
              onClick={() => onSelectDate(null)}
              aria-label="Limpar filtro de data"
              title="Limpar filtro de data"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
