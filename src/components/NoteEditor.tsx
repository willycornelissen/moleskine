import React, { useState, useEffect, useRef } from "react";
import { useDraftBuffer } from "@/hooks/useDraftBuffer";
import { Plus, Check, X, Tag as TagIcon } from "lucide-react";
import type { NoteDocument } from "@/types/note";

interface NoteEditorProps {
  editingNote?: NoteDocument | null;
  onSave: (text: string, tags: string[]) => Promise<void>;
  onCancelEdit?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  editingNote,
  onSave,
  onCancelEdit,
}) => {
  const isEditing = Boolean(editingNote);
  const { draft, setDraft, clearDraft } = useDraftBuffer("moleskine_active_draft");

  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Inicializa o estado conforme o modo (edição de nota existente ou novo rascunho)
  useEffect(() => {
    if (editingNote) {
      setText(editingNote.text);
      setTags(editingNote.tags || []);
    } else {
      // Carrega rascunho persistido
      setText(draft.text || "");
      setTags(draft.tags || []);
    }
  }, [editingNote, draft.text, draft.tags]);

  // Se estiver criando nova nota, sincroniza com o buffer de rascunho local
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (!isEditing) {
      setDraft({ text: newText, tags });
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.replace(/,/g, "").trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const nextTags = [...tags, trimmed];
      setTags(nextTags);
      setTagInput("");
      if (!isEditing) {
        setDraft({ text, tags: nextTags });
      }
    } else {
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    if (!isEditing) {
      setDraft({ text, tags: nextTags });
    }
  };

  const handleKeyDownTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || isSubmitting) return;

    // Se ainda houver texto no input de tag, adiciona antes de salvar
    const finalTags = [...tags];
    const pendingTag = tagInput.replace(/,/g, "").trim().toLowerCase();
    if (pendingTag && !finalTags.includes(pendingTag)) {
      finalTags.push(pendingTag);
      setTagInput("");
    }

    try {
      setIsSubmitting(true);
      await onSave(trimmedText, finalTags);

      if (!isEditing) {
        setText("");
        setTags([]);
        clearDraft();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm mb-8 transition-shadow focus-within:shadow-md"
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDownTextarea}
          placeholder="O que você está pensando hoje? (Ctrl+Enter para salvar)"
          rows={3}
          className="w-full resize-y min-h-[90px] p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 bg-transparent border-0 focus:ring-0 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Tags chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-1 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 ml-0.5"
                title={`Remover tag #${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Editor toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 max-w-xs flex-1">
          <TagIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDownTagInput}
            onBlur={handleAddTag}
            placeholder="Adicionar tag (Enter ou vírgula)..."
            className="w-full text-xs bg-transparent text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Atualizando..." : "Atualizar"}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Salvando..." : "Anotar"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
