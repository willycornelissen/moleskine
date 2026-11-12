import React, { useState } from "react";
import type { NoteDocument } from "@/types/note";
import { exportToJson, exportToMarkdownZip } from "@/services/exportService";
import { X, FileJson, FileArchive, Loader2, ShieldCheck } from "lucide-react";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteDocument[];
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  notes,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    try {
      setErrorMessage(null);
      const jsonContent = exportToJson(notes);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadFile(blob, `moleskine-backup-${timestamp}.json`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    }
  };

  const handleExportZip = async () => {
    try {
      setErrorMessage(null);
      setIsExportingZip(true);
      const zipBlob = await exportToMarkdownZip(notes);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadFile(zipBlob, `moleskine-markdown-${timestamp}.zip`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Backup do Diário
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Exporte suas <strong className="text-zinc-900 dark:text-zinc-200">{notes.length} anotações</strong> para armazenamento offline, garantindo soberania total dos seus dados sem qualquer aprisionamento tecnológico (Zero Lock-in).
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3">
            {/* JSON Export Button */}
            <button
              type="button"
              onClick={handleExportJson}
              disabled={notes.length === 0}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-850 hover:bg-white dark:hover:bg-zinc-800 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Exportar como JSON
                  </div>
                  <div className="text-xs text-zinc-500">
                    Arquivo estruturado com todas as notas e metadados
                  </div>
                </div>
              </div>
            </button>

            {/* ZIP Markdown Export Button */}
            <button
              type="button"
              onClick={handleExportZip}
              disabled={notes.length === 0 || isExportingZip}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-850 hover:bg-white dark:hover:bg-zinc-800 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  {isExportingZip ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileArchive className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {isExportingZip ? "Compactando ZIP..." : "Exportar ZIP com Markdown"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Arquivos .md individuais com Frontmatter YAML (Obsidian / Logseq)
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
