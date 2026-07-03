"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { resolveStickerImageUrl, type StickerAssetMode } from "@/lib/s3/stickerAssets";

const StickerAssetContext = createContext<StickerAssetMode>("local");

export function StickerAssetProvider({
  mode,
  children,
}: {
  mode: StickerAssetMode;
  children: React.ReactNode;
}) {
  return (
    <StickerAssetContext.Provider value={mode}>{children}</StickerAssetContext.Provider>
  );
}

export function useStickerAssetMode() {
  return useContext(StickerAssetContext);
}

/** Resolves sticker URL from server-checked mode (S3 or local). */
export function useStickerImageUrl(imagePath: string) {
  const mode = useStickerAssetMode();
  return resolveStickerImageUrl(imagePath, mode);
}

/** Same as useStickerImageUrl, but falls back to public/stickers on load error. */
export function useStickerImageWithFallback(imagePath: string) {
  const mode = useStickerAssetMode();
  const primary = resolveStickerImageUrl(imagePath, mode);
  const localUrl = resolveStickerImageUrl(imagePath, "local");
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(primary);
  }, [primary, imagePath]);

  const onError = useCallback(() => {
    setSrc((current) => (current !== localUrl ? localUrl : current));
  }, [localUrl]);

  return { src, onError, localUrl };
}
