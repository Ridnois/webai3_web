import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerEnv } from "./server-env";

let s3Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!s3Client) {
    const env = getServerEnv();
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

function getBucket(): string {
  return getServerEnv().R2_BUCKET_NAME;
}

function extensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.split("?")[0];
    if (ext && ext.length <= 5) return ext;
  } catch {
    // fall through
  }
  return "bin";
}

export async function uploadMediaToR2(
  sourceUrl: string,
  walletAddress: string,
  inferenceId: string,
  index: number
): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch media from ${sourceUrl}: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const ext = extensionFromUrl(sourceUrl);
  const key = `${walletAddress}/${inferenceId}/${index}.${ext}`;

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedUrls(keys: string[]): Promise<string[]> {
  return Promise.all(keys.map((key) => getPresignedUrl(key)));
}
