export interface NoteDocument {
  id: string;
  text: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface NoteFilterCriteria {
  query?: string;
  tag?: string | null;
  searchQuery?: string;
  selectedTags?: string[];
  selectedDate?: string | null; // "YYYY-MM-DD"
  startDate?: number;
  endDate?: number;
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";
