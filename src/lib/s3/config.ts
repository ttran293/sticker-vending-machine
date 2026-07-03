export type S3Config = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Public base URL for sticker assets (S3 website, bucket URL, or CloudFront) */
  publicBaseUrl: string;
};

export const STICKER_S3_PREFIX = "stickers/";

export function isS3Configured() {
  return Boolean(getS3Config());
}

export function getS3Config(): S3Config | null {
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  const bucket = process.env.AWS_S3_STICKERS_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_STICKER_ASSET_BASE_URL?.replace(/\/$/, "") ??
    (region && bucket
      ? `https://${bucket}.s3.${region}.amazonaws.com`
      : undefined);

  if (!region || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return null;
  }

  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl,
  };
}
