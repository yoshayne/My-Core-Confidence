import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useApi } from "../../lib/api";
import type { StoryContent } from "../../../../shared/types";

const IMAGE_KEYS = new Set(["hero_image", "signature_image", "story_image", "profile_image"]);

const TEXTAREA_KEYS = new Set([
  "story_text",
  "profile_bio",
  "quote",
  "subline",
  "auth_subtitle",
]);

const FIELDS: { key: string; label: string }[] = [
  { key: "tagline", label: "Tagline" },
  { key: "tagline_highlight", label: "Tagline highlight" },
  { key: "subline", label: "Subline" },
  { key: "hero_image", label: "Landing page photo (trainer)" },
  { key: "signature_image", label: "Signature image" },
  { key: "founder_label", label: "Founder label" },
  { key: "auth_title", label: "Auth title" },
  { key: "auth_subtitle", label: "Auth subtitle" },
  { key: "story_title", label: "Story title" },
  { key: "story_highlight", label: "Story highlight" },
  { key: "story_text", label: "Story text" },
  { key: "story_image", label: "Story image" },
  { key: "quote", label: "Quote" },
  { key: "profile_title", label: "Profile title" },
  { key: "profile_bio", label: "Profile bio" },
  { key: "profile_cta", label: "Profile CTA" },
  { key: "profile_image", label: "Profile image" },
  { key: "player_strip_title", label: "Player strip title" },
  { key: "player_strip_tagline", label: "Player strip tagline" },
  { key: "social_instagram", label: "Instagram URL" },
  { key: "social_youtube", label: "YouTube URL" },
  { key: "social_tiktok", label: "TikTok URL" },
];

export default function AdminStory() {
  const apiFetch = useApi();
  const [form, setForm] = useState<StoryContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const story = await apiFetch<StoryContent>("/api/story");
        if (!cancelled) setForm(story);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load story");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  async function handleImageUpload(key: string, file: File) {
    setUploadingKey(key);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await apiFetch<{ url: string }>("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      setForm((f) => (f ? { ...f, [key]: url } : f));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await apiFetch("/api/admin/story", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return error ? <p className="text-sm text-red-400">{error}</p> : null;
  }

  return (
    <div className="space-y-3 pb-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-success">Saved.</p>}

      {FIELDS.map(({ key, label }) => (
        <label key={key} className="block">
          <span className="mb-1 block text-xs font-semibold text-text-secondary">{label}</span>
          {IMAGE_KEYS.has(key) ? (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-[10px] bg-bg-raise">
                {form[key] && (
                  <img src={form[key]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <input
                ref={(el) => {
                  fileInputs.current[key] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(key, file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputs.current[key]?.click()}
                disabled={uploadingKey === key}
                className="flex items-center gap-2 rounded-button border border-card-border px-3 py-2 text-sm text-text disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploadingKey === key ? "Uploading…" : "Upload image"}
              </button>
              {form[key] && (
                <button
                  type="button"
                  onClick={() => setForm((f) => (f ? { ...f, [key]: "" } : f))}
                  className="flex items-center gap-2 rounded-button border border-card-border px-3 py-2 text-sm text-red-400 transition hover:bg-bg-raise"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>
          ) : TEXTAREA_KEYS.has(key) ? (
            <textarea
              value={form[key] ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
              rows={3}
              className="w-full rounded-button border border-card-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-blue"
            />
          ) : (
            <input
              type="text"
              value={form[key] ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
              className="w-full rounded-button border border-card-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-blue"
            />
          )}
        </label>
      ))}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-button bg-blue py-3 font-semibold text-white transition hover:bg-blue-deep disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
