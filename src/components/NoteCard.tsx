import React from "react";
import type { NoteDocument } from "@/types/note";
import { Calendar, Tag as TagIcon, Edit3, Trash2 } from "lucide-react";

interface NoteCardProps {
  note: NoteDocument;
  onEdit: (note: NoteDocument) => void;
  onDelete: (noteId: string) => void;
  onTagClick: (tag: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTagClick,
}) => {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(note.createdAt));

  const handleDelete = () => {
    if (window.confirm("Deseja realmente excluir esta anotação?")) {
      onDelete(note.id);
    }
  };

  return (
    <article className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      {/* Content */}
      <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words mb-4">
        {note.text}
      </div>

      {/* Footer / Metadata & Actions */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-2">
          {/* Timestamp */}
          <span className="inline-flex items-center gap-1" title="Data de criação">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <time dateTime={new Date(note.createdAt).toISOString()}>{formattedDate}</time>
          </span>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 ml-1">
              {note.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                  title={`Filtrar por tag #${tag}`}
                >
                  <TagIcon className="w-3 h-3 text-zinc-400" />
                  <span>#{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card actions */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Editar anotação"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            title="Excluir anotação"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
