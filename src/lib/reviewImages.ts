import { existsSync, readdirSync } from "fs";
import path from "path";
import { isS3Configured } from "@/lib/s3/config";
import {
  getReviewAssetMode,
  listReviewPathsFromS3,
  normalizeReviewPath,
  resolveReviewImageUrl,
} from "@/lib/s3/reviewAssets";

const LOCAL_REVIEW_ROOT = path.join(process.cwd(), "public", "img_review");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export type ReviewImage = {
  path: string;
  image: string;
  alt: string;
};

function altFromPath(reviewPath: string) {
  const fileName = reviewPath.replace(/^\/reviews\//, "").replace(/\.[^.]+$/, "");
  return fileName.replace(/[-_]+/g, " ").trim() || "Review photo";
}

function listLocalReviewPaths(): string[] {
  if (!existsSync(LOCAL_REVIEW_ROOT)) {
    return [];
  }

  return readdirSync(LOCAL_REVIEW_ROOT)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .map((name) => `/reviews/${name}`)
    .sort((a, b) => a.localeCompare(b));
}

async function listReviewPaths(): Promise<string[]> {
  const mode = await getReviewAssetMode();

  if (mode === "s3") {
    try {
      const fromS3 = await listReviewPathsFromS3();
      if (fromS3.length > 0) return fromS3;
    } catch (error) {
      console.error("[reviews] S3 listing failed, falling back to local img_review:", error);
    }
  }

  return listLocalReviewPaths();
}

function toReviewImages(paths: string[], mode: "s3" | "local"): ReviewImage[] {
  return paths.map((reviewPath) => ({
    path: normalizeReviewPath(reviewPath),
    image: resolveReviewImageUrl(reviewPath, mode),
    alt: altFromPath(reviewPath),
  }));
}

/** Public OFF THE RACK gallery — S3 when available, else local img_review backup. */
export async function getReviewImages(): Promise<ReviewImage[]> {
  const mode = await getReviewAssetMode();
  const paths = await listReviewPaths();
  return toReviewImages(paths, mode);
}

/** Dashboard — S3-only when configured; local demo files when S3 is not set up. */
export async function getAdminReviewImages(): Promise<ReviewImage[]> {
  if (isS3Configured()) {
    try {
      const paths = await listReviewPathsFromS3();
      return toReviewImages(paths, "s3");
    } catch (error) {
      console.error("[reviews] Admin S3 listing failed:", error);
      return [];
    }
  }

  return toReviewImages(listLocalReviewPaths(), "local");
}
