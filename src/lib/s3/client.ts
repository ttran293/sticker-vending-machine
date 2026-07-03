import { S3Client } from "@aws-sdk/client-s3";
import { getS3Config } from "@/lib/s3/config";

let client: S3Client | null = null;

export function getS3Client() {
  const config = getS3Config();
  if (!config) return null;

  if (!client) {
    client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return client;
}
