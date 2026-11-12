import type { NoteDocument } from "@/types/note";

export interface CalendarDay {
  date: Date;
  dateKey: string; // "YYYY-MM-DD"
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  notesCount: number;
}

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/**
 * Converte timestamp numérico ou objeto Date na chave local "YYYY-MM-DD".
 */
export function toDateKey(dateOrTimestamp: Date | number): string {
  const d =
    typeof dateOrTimestamp === "number"
      ? new Date(dateOrTimestamp)
      : dateOrTimestamp;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Mapeia e conta o número de notas registradas por cada chave de data "YYYY-MM-DD".
 */
export function getNotesPerDayMap(notes: NoteDocument[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const note of notes) {
    if (typeof note.createdAt === "number" && !isNaN(note.createdAt)) {
      const key = toDateKey(note.createdAt);
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Formata o mês e ano para exibição no cabeçalho do calendário em português.
 */
export function formatMonthYear(year: number, month: number): string {
  const monthName = MONTH_NAMES[month] || "";
  return `${monthName} de ${year}`;
}

/**
 * Gera a grade (grid) semanal de dias para o mês e ano solicitados,
 * incluindo dias de preenchimento (trailing/leading) dos meses adjacentes.
 */
export function getMonthCalendarGrid(
  year: number,
  month: number,
  notesCountMap: Record<string, number> = {},
  todayDateKey: string = toDateKey(new Date())
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Dias precedentes do mês anterior para completar a primeira semana
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = prevMonthTotalDays - i;
    const date = new Date(year, month - 1, dayNumber);
    const dateKey = toDateKey(date);
    days.push({
      date,
      dateKey,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateKey === todayDateKey,
      notesCount: notesCountMap[dateKey] || 0,
    });
  }

  // Dias do mês atual
  for (let dayNumber = 1; dayNumber <= daysInCurrentMonth; dayNumber++) {
    const date = new Date(year, month, dayNumber);
    const dateKey = toDateKey(date);
    days.push({
      date,
      dateKey,
      dayNumber,
      isCurrentMonth: true,
      isToday: dateKey === todayDateKey,
      notesCount: notesCountMap[dateKey] || 0,
    });
  }

  // Dias subsequentes do próximo mês para fechar semanas completas (múltiplo de 7)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let dayNumber = 1; dayNumber <= remainingCells; dayNumber++) {
    const date = new Date(year, month + 1, dayNumber);
    const dateKey = toDateKey(date);
    days.push({
      date,
      dateKey,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateKey === todayDateKey,
      notesCount: notesCountMap[dateKey] || 0,
    });
  }

  return days;
}
