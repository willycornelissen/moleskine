import React from "react";
import { Search, X, Tag } from "lucide-react";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  activeTag: string | null;
  onClearTag: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  activeTag,
  onClearTag,
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar no diário..."
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-colors shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            title="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {activeTag && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 shrink-0">
          <Tag className="w-3.5 h-3.5 text-zinc-500" />
          <span>#{activeTag}</span>
          <button
            type="button"
            onClick={onClearTag}
            className="ml-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
            title="Remover filtro de tag"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
