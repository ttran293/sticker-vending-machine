"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { SlotPointerHit } from "@/lib/rackPointer";

type RackHoverContextValue = {
  getHoveredId: () => string | null;
  applyPointerHit: (hit: SlotPointerHit) => void;
  clearHover: () => void;
  triggerPunch: (stickerId: string) => void;
  consumePunch: (stickerId: string) => boolean;
};

const RackHoverContext = createContext<RackHoverContextValue | null>(null);

export function RackHoverProvider({ children }: { children: ReactNode }) {
  const hoveredIdRef = useRef<string | null>(null);
  const punchIdRef = useRef<string | null>(null);

  const clearHover = useCallback(() => {
    hoveredIdRef.current = null;
  }, []);

  const applyPointerHit = useCallback((hit: SlotPointerHit) => {
    hoveredIdRef.current = hit.zone === "sticker" && hit.sticker ? hit.sticker.id : null;
  }, []);

  const triggerPunch = useCallback((stickerId: string) => {
    punchIdRef.current = stickerId;
  }, []);

  const consumePunch = useCallback((stickerId: string) => {
    if (punchIdRef.current !== stickerId) return false;
    punchIdRef.current = null;
    return true;
  }, []);

  const getHoveredId = useCallback(() => hoveredIdRef.current, []);

  const value = useMemo(
    () => ({
      getHoveredId,
      applyPointerHit,
      clearHover,
      triggerPunch,
      consumePunch,
    }),
    [getHoveredId, applyPointerHit, clearHover, triggerPunch, consumePunch],
  );

  return <RackHoverContext.Provider value={value}>{children}</RackHoverContext.Provider>;
}

export function useRackHover() {
  return useContext(RackHoverContext);
}
