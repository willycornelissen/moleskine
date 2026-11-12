import React from "react";
import type { SyncStatus } from "@/types/note";
import type { User } from "firebase/auth";
import { SyncBadge } from "./SyncBadge";
import { BookOpen, Download, LogOut } from "lucide-react";

interface HeaderProps {
  user: User | null;
  syncStatus: SyncStatus;
  onOpenBackup: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  syncStatus,
  onOpenBackup,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
              Moleskine
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Diário Pessoal
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SyncBadge status={syncStatus} />

          <button
            type="button"
            onClick={onOpenBackup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Exportar backup dos dados"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-xs font-semibold flex items-center justify-center text-zinc-700 dark:text-zinc-200">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
