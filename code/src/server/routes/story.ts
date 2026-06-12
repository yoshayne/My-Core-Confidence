import { Hono } from "hono";
import { query } from "../lib/db";

export const storyRoute = new Hono();

// Public — powers landing page and profile copy, editable via the admin story editor.
storyRoute.get("/", async (c) => {
  const { rows } = await query<{ content_key: string; content_value: string | null }>(
    `SELECT content_key, content_value FROM story_content`
  );

  const story: Record<string, string> = {};
  for (const row of rows) {
    story[row.content_key] = row.content_value ?? "";
  }

  return c.json(story);
});
