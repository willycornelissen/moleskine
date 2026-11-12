import React from "react";
import type { SyncStatus } from "@/types/note";
import { CheckCircle2, Loader2, CloudOff, AlertCircle } from "lucide-react";

interface SyncBadgeProps {
  status: SyncStatus;
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({ status }) => {
  switch (status) {
    case "syncing":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          title="Sincronizando alterações locais com o Firestore..."
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Sincronizando...</span>
        </span>
      );
    case "offline":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 bg-zinc-100 border border-zinc-300 rounded-full dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
          title="Sem conexão de rede. As alterações estão sendo salvas localmente no IndexedDB e serão sincronizadas quando online."
        >
          <CloudOff className="w-3.5 h-3.5 text-zinc-500" />
          <span>Modo Offline</span>
        </span>
      );
    case "error":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          title="Erro ao sincronizar dados com o Firestore."
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <span>Erro de sincronização</span>
        </span>
      );
    case "synced":
    default:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          title="Todas as notas sincronizadas na nuvem."
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Sincronizado</span>
        </span>
      );
  }
};
