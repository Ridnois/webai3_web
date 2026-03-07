import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getServerEnv } from "./server-env";
import { fetchWithTimeout } from "./fetch-with-timeout";

const ALLOWED_MEDIA_HOSTS = [
  "replicate.delivery",
  "replicate.com",
  "pbxt.replicate.delivery",
];

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
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    throw new Error("Invalid media source URL");
  }

  if (!ALLOWED_MEDIA_HOSTS.some((h) => parsedUrl.hostname.endsWith(h))) {
    throw new Error(`Untrusted media host: ${parsedUrl.hostname}`);
  }

  const res = await fetchWithTimeout(sourceUrl, { timeoutMs: 60_000 });
  if (!res.ok) {
    throw new Error(`Failed to fetch media: ${res.status}`);
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

export function getPublicUrl(key: string): string {
  const env = getServerEnv();
  const base = env.R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${key}`;
}

export function getPublicUrls(keys: string[]): string[] {
  return keys.map((key) => getPublicUrl(key));
}
