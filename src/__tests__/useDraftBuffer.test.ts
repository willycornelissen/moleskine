import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftBuffer } from "@/hooks/useDraftBuffer";

describe("useDraftBuffer", () => {
  const TEST_KEY = "test_draft_key";

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with empty draft when localStorage is empty", () => {
    const { result } = renderHook(() => useDraftBuffer(TEST_KEY));

    expect(result.current.draft).toEqual({ text: "", tags: [] });
  });

  it("should load existing draft from localStorage on mount", () => {
    localStorage.setItem(
      TEST_KEY,
      JSON.stringify({ text: "Texto salvo anteriormente", tags: ["salvo"] })
    );

    const { result } = renderHook(() => useDraftBuffer(TEST_KEY));

    expect(result.current.draft).toEqual({
      text: "Texto salvo anteriormente",
      tags: ["salvo"],
    });
  });

  it("should update state immediately and debounce saving to localStorage by 300ms", () => {
    const { result } = renderHook(() => useDraftBuffer(TEST_KEY));

    act(() => {
      result.current.setDraft({ text: "Digitando...", tags: ["dev"] });
    });

    // Estado na memória atualiza imediatamente
    expect(result.current.draft).toEqual({ text: "Digitando...", tags: ["dev"] });

    // Ainda não gravado no localStorage antes do tempo limite
    expect(localStorage.getItem(TEST_KEY)).toBeNull();

    // Avança 299ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(localStorage.getItem(TEST_KEY)).toBeNull();

    // Avança para completar 300ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(localStorage.getItem(TEST_KEY)).toBe(
      JSON.stringify({ text: "Digitando...", tags: ["dev"] })
    );
  });

  it("should remove key from localStorage when clearing draft", () => {
    localStorage.setItem(
      TEST_KEY,
      JSON.stringify({ text: "Rascunho", tags: [] })
    );

    const { result } = renderHook(() => useDraftBuffer(TEST_KEY));

    act(() => {
      result.current.clearDraft();
    });

    expect(result.current.draft).toEqual({ text: "", tags: [] });
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });
});
