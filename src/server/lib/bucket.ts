import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const bucketName = process.env.BUCKET_NAME ?? "";

export const s3 = new S3Client({
  endpoint: process.env.BUCKET_ENDPOINT,
  region: process.env.BUCKET_REGION ?? "auto",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY ?? "",
  },
});

// Uploads a file to the Railway bucket and returns its public URL.
export async function uploadImage(
  body: Buffer,
  contentType: string,
  originalName: string
): Promise<string> {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  const key = `images/${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  // Prefer an explicit public URL if set, otherwise fall back to the
  // S3-compatible endpoint + bucket name (path-style), which Railway's
  // bucket service exposes as a public HTTPS URL.
  const base = (
    process.env.BUCKET_PUBLIC_URL || `${process.env.BUCKET_ENDPOINT ?? ""}/${bucketName}`
  ).replace(/\/$/, "");

  if (!base || base === "/") {
    throw new Error("Bucket is not configured: set BUCKET_PUBLIC_URL or BUCKET_ENDPOINT + BUCKET_NAME");
  }

  return `${base}/${key}`;
}
