import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useCoarsePointer } from "./use-coarse-pointer";

function makeMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  return {
    matches,
    addEventListener: vi.fn((_: string, fn: (e: MediaQueryListEvent) => void) => {
      listeners.push(fn);
    }),
    removeEventListener: vi.fn(),
    _trigger: (newMatches: boolean) => {
      listeners.forEach((fn) => fn({ matches: newMatches } as MediaQueryListEvent));
    },
  };
}

describe("useCoarsePointer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when pointer is fine (mouse/trackpad)", () => {
    const mq = makeMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mq);

    const { result } = renderHook(() => useCoarsePointer());
    expect(result.current).toBe(false);
  });

  it("returns true when pointer is coarse (touch screen)", () => {
    const mq = makeMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mq);

    const { result } = renderHook(() => useCoarsePointer());
    expect(result.current).toBe(true);
  });

  it("updates when pointer type changes", () => {
    const mq = makeMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mq);

    const { result } = renderHook(() => useCoarsePointer());
    expect(result.current).toBe(false);

    act(() => mq._trigger(true));
    expect(result.current).toBe(true);

    act(() => mq._trigger(false));
    expect(result.current).toBe(false);
  });

  it("removes the event listener on unmount", () => {
    const mq = makeMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mq);

    const { unmount } = renderHook(() => useCoarsePointer());
    unmount();

    expect(mq.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
