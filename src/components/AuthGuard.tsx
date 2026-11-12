import React from "react";
import type { User } from "firebase/auth";
import { BookOpen, LogIn, Loader2, AlertCircle } from "lucide-react";

interface AuthGuardProps {
  loading: boolean;
  isAuthorized: boolean;
  user: User | null;
  error: string | null;
  onLogin: () => void;
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  loading,
  isAuthorized,
  error,
  onLogin,
  children,
}) => {
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Carregando Moleskine...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center mb-5 shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Moleskine
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 mb-6 leading-relaxed">
            Diário pessoal estritamente privado. Acesso restrito com autenticação Google autorizada.
          </p>

          {error && (
            <div className="w-full mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-left flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300 leading-snug">
                {error}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onLogin}
            className="w-full py-3 px-4 inline-flex items-center justify-center gap-2.5 rounded-xl text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar com Google</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
