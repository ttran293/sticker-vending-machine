"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { BOTTOM_ROW_POINTER_Y } from "@/lib/sticker3dConstants";

type ClearHover = () => void;

type RackHoverContextValue = {
  register: (clear: ClearHover) => () => void;
  clearAll: () => void;
  /** Drive lock from live pointer.y every frame — not per-mesh pointerOut */
  syncBottomRow: (pointerY: number) => void;
  isHoverLocked: () => boolean;
};

const RackHoverContext = createContext<RackHoverContextValue | null>(null);

export function RackHoverProvider({
  children,
  clearAllRef,
}: {
  children: ReactNode;
  clearAllRef?: MutableRefObject<(() => void) | null>;
}) {
  const clearsRef = useRef(new Set<ClearHover>());
  const bottomRowActiveRef = useRef(false);

  const register = useCallback((clear: ClearHover) => {
    clearsRef.current.add(clear);
    return () => {
      clearsRef.current.delete(clear);
    };
  }, []);

  const clearAll = useCallback(() => {
    clearsRef.current.forEach((clear) => clear());
  }, []);

  const syncBottomRow = useCallback(
    (pointerY: number) => {
      const inBottom = pointerY < BOTTOM_ROW_POINTER_Y;
      if (inBottom && !bottomRowActiveRef.current) {
        clearAll();
      }
      bottomRowActiveRef.current = inBottom;
    },
    [clearAll],
  );

  const isHoverLocked = useCallback(() => bottomRowActiveRef.current, []);

  useEffect(() => {
    if (!clearAllRef) return;
    clearAllRef.current = clearAll;
    return () => {
      clearAllRef.current = null;
    };
  }, [clearAll, clearAllRef]);

  const value = useMemo(
    () => ({ register, clearAll, syncBottomRow, isHoverLocked }),
    [register, clearAll, syncBottomRow, isHoverLocked],
  );

  return <RackHoverContext.Provider value={value}>{children}</RackHoverContext.Provider>;
}

export function useRackHover() {
  return useContext(RackHoverContext);
}
