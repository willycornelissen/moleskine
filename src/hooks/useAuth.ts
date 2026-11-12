import { useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/services/firebase";

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const UNAUTHORIZED_ERROR_MSG =
  "Acesso negado: Este diário é privado e restrito exclusivamente ao autor.";

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorUid = import.meta.env.VITE_AUTHOR_UID;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (authorUid && currentUser.uid !== authorUid) {
          // Usuário autenticado pelo Google, mas UID não corresponde ao proprietário do diário
          signOut(auth).catch(() => {});
          setUser(null);
          setIsAuthorized(false);
          setError(UNAUTHORIZED_ERROR_MSG);
        } else {
          setUser(currentUser);
          setIsAuthorized(true);
          setError(null);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authorUid]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      if (authorUid && signedInUser.uid !== authorUid) {
        await signOut(auth);
        setUser(null);
        setIsAuthorized(false);
        setError(UNAUTHORIZED_ERROR_MSG);
      } else {
        setUser(signedInUser);
        setIsAuthorized(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Se usuário cancelou o popup, não trata como erro crítico
        if (
          err.message.includes("popup-closed-by-user") ||
          err.message.includes("cancelled-popup-request")
        ) {
          return;
        }
        setError(err.message);
      } else {
        setError("Erro desconhecido durante a autenticação.");
      }
    }
  }, [authorUid]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthorized(false);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, []);

  return {
    user,
    loading,
    isAuthorized,
    error,
    signInWithGoogle,
    logout,
  };
}
