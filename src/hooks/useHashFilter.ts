import { useState, useEffect, useCallback } from "react";

/**
 * Hook minimalista para sincronizar uma tag ativa com o hash da URL (ex: #/tag/esporte),
 * provendo URLs compartilháveis e compatibilidade 100% estática com GitHub Pages sem react-router.
 */
export function useHashFilter() {
  const getTagFromHash = (): string | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    const match = hash.match(/^#\/tag\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const [activeTag, setActiveTag] = useState<string | null>(getTagFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTag(getTagFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const setTag = useCallback((tag: string | null) => {
    if (tag) {
      const normalized = tag.toLowerCase();
      window.location.hash = `#/tag/${encodeURIComponent(normalized)}`;
      setActiveTag(normalized);
    } else {
      window.history.pushState(
        "",
        document.title,
        window.location.pathname + window.location.search
      );
      setActiveTag(null);
    }
  }, []);

  return { activeTag, setTag };
}
