import type { LaminateId } from "@/data/laminates";

export function LaminateSwatch({
  laminateId,
  className = "",
}: {
  laminateId: LaminateId;
  className?: string;
}) {
  return (
    <span
      className={`laminate-swatch laminate-swatch--${laminateId} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export function LaminateOverlay({
  laminateId,
  image,
}: {
  laminateId: LaminateId;
  image?: string;
}) {
  return (
    <span
      className={`laminate-overlay laminate-overlay--${laminateId}`}
      style={
        image
          ? {
              WebkitMaskImage: `url(${image})`,
              maskImage: `url(${image})`,
            }
          : undefined
      }
      aria-hidden="true"
    />
  );
}
