import { Hono } from "hono";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, bucketName } from "../lib/bucket";

export const mediaRoute = new Hono();

// Proxies reads from the bucket — Railway's bucket (Tigris) doesn't support
// public object ACLs, so images are served through our own credentials.
mediaRoute.get("/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/media\//, "");
  if (!key) return c.notFound();

  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    if (!obj.Body) return c.notFound();

    const bytes = await obj.Body.transformToByteArray();
    c.header("Content-Type", obj.ContentType ?? "application/octet-stream");
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.body(Buffer.from(bytes));
  } catch {
    return c.notFound();
  }
});
