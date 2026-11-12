import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHashFilter } from "@/hooks/useHashFilter";

describe("useHashFilter", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("should initialize with null when no tag hash exists", () => {
    const { result } = renderHook(() => useHashFilter());
    expect(result.current.activeTag).toBeNull();
  });

  it("should parse tag from initial window.location.hash", () => {
    window.location.hash = "#/tag/tecnologia";
    const { result } = renderHook(() => useHashFilter());
    expect(result.current.activeTag).toBe("tecnologia");
  });

  it("should update hash when setTag is called with a value", () => {
    const { result } = renderHook(() => useHashFilter());

    act(() => {
      result.current.setTag("react");
    });

    expect(window.location.hash).toBe("#/tag/react");
    expect(result.current.activeTag).toBe("react");
  });

  it("should respond to window hashchange events", () => {
    const { result } = renderHook(() => useHashFilter());

    act(() => {
      window.location.hash = "#/tag/offline";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(result.current.activeTag).toBe("offline");
  });

  it("should clear active tag and hash when setTag(null) is called", () => {
    window.location.hash = "#/tag/remover";
    const { result } = renderHook(() => useHashFilter());

    act(() => {
      result.current.setTag(null);
    });

    expect(result.current.activeTag).toBeNull();
  });
});
