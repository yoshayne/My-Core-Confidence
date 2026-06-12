import jwt from "jsonwebtoken";

// Mints a short-lived token that lets the player stream ONE video.
// Only call this AFTER verifying the user may watch (free workout, or
// active subscriber per CLAUDE.md Section 8.4).
export function mintPlaybackToken(playbackId: string): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID!;
  const privateKey = Buffer.from(
    process.env.MUX_SIGNING_PRIVATE_KEY!,
    "base64"
  ).toString("utf8");

  return jwt.sign(
    {
      sub: playbackId,
      aud: "v", // "v" = video playback
      exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours
      kid: keyId,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}
