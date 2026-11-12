import React from "react";
import type { NoteDocument } from "@/types/note";
import { NoteCard } from "./NoteCard";
import { BookOpen, SearchX } from "lucide-react";

interface NoteListProps {
  notes: NoteDocument[];
  hasFilter: boolean;
  onEdit: (note: NoteDocument) => void;
  onDelete: (noteId: string) => void;
  onTagClick: (tag: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  hasFilter,
  onEdit,
  onDelete,
  onTagClick,
}) => {
  if (notes.length === 0) {
    if (hasFilter) {
      return (
        <div className="py-16 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Nenhuma anotação encontrada
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            Tente buscar com outros termos ou limpe o filtro de tags.
          </p>
        </div>
      );
    }

    return (
      <div className="py-16 text-center flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Seu diário está em branco
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
          Escreva sua primeira reflexão ou anotação no campo acima.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
};
