import { useEffect, useRef, useState } from "react";
import { MoreVertical, Plus, Upload, X } from "lucide-react";
import { useApi, formatDuration } from "../../lib/api";
import type { AdminWorkout, WorkoutLevel } from "../../../../shared/types";
import Modal from "./Modal";

const LEVELS: WorkoutLevel[] = ["Beginner", "Intermediate", "Advanced"];

type FormState = {
  title: string;
  description: string;
  level: WorkoutLevel;
  category: string;
  thumbnail_url: string | null;
  is_free: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  level: "Beginner",
  category: "",
  thumbnail_url: null,
  is_free: false,
  is_featured: false,
  is_published: false,
  sort_order: 0,
};

function StatusPill({ workout }: { workout: AdminWorkout }) {
  if (workout.mux_status === "pending") {
    return (
      <span className="rounded-pill bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-400">
        PROCESSING
      </span>
    );
  }
  if (workout.is_published) {
    return (
      <span className="rounded-pill bg-success/20 px-2 py-0.5 text-[9px] font-bold tracking-wider text-success">
        PUBLISHED
      </span>
    );
  }
  return (
    <span className="rounded-pill bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-text-secondary">
      DRAFT
    </span>
  );
}

export default function AdminWorkouts() {
  const apiFetch = useApi();
  const [workouts, setWorkouts] = useState<AdminWorkout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminWorkout | null | "new">(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const { workouts } = await apiFetch<{ workouts: AdminWorkout[] }>("/api/admin/workouts");
      setWorkouts(workouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workouts");
    }
  }

  useEffect(() => {
    load();
  }, [apiFetch]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing("new");
  }

  function openEdit(workout: AdminWorkout) {
    setForm({
      title: workout.title,
      description: workout.description ?? "",
      level: workout.level,
      category: workout.category ?? "",
      thumbnail_url: workout.thumbnail_url,
      is_free: workout.is_free,
      is_featured: workout.is_featured,
      is_published: workout.is_published,
      sort_order: workout.sort_order,
    });
    setEditing(workout);
    setOpenMenuId(null);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        level: form.level,
        category: form.category || null,
        thumbnail_url: form.thumbnail_url,
        is_free: form.is_free,
        is_featured: form.is_featured,
        is_published: form.is_published,
        sort_order: form.sort_order,
      };
      if (editing === "new") {
        const created = await apiFetch<AdminWorkout>("/api/admin/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await load();
        setEditing(created);
        setForm((f) => ({ ...f, thumbnail_url: created.thumbnail_url }));
        return;
      } else if (editing) {
        await apiFetch(`/api/admin/workouts/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(workout: AdminWorkout) {
    setOpenMenuId(null);
    try {
      await apiFetch(`/api/admin/workouts/${workout.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !workout.is_published }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workout");
    }
  }

  async function handleDelete(workout: AdminWorkout) {
    setOpenMenuId(null);
    if (!window.confirm(`Delete "${workout.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/workouts/${workout.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workout");
    }
  }

  async function handleThumbnailFile(file: File) {
    setThumbUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await apiFetch<{ url: string }>("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      setForm((f) => ({ ...f, thumbnail_url: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setThumbUploading(false);
    }
  }

  async function handleVideoFile(file: File) {
    if (editing === "new" || !editing) return;
    setVideoUploading(true);
    setVideoProgress(0);
    setError(null);
    try {
      const { uploadUrl } = await apiFetch<{ uploadUrl: string; uploadId: string }>(
        "/api/admin/mux-upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workoutId: editing.id }),
        }
      );
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video");
    } finally {
      setVideoUploading(false);
      setVideoProgress(null);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={openNew}
        className="flex w-full items-center justify-center gap-2 rounded-button bg-blue py-3 font-semibold text-white transition hover:bg-blue-deep"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        New workout
      </button>

      <div className="mt-4 space-y-2">
        {(workouts ?? []).map((workout) => (
          <div
            key={workout.id}
            className="flex items-center gap-3 rounded-card border border-card-border bg-card p-3"
          >
            <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-[10px] bg-bg-raise">
              {workout.thumbnail_url && (
                <img
                  src={workout.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{workout.title}</p>
              <p className="text-xs text-text-secondary">
                {[workout.level, workout.category, formatDuration(workout.duration_seconds)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-1 flex gap-1.5">
                <StatusPill workout={workout} />
                <span
                  className={`rounded-pill px-2 py-0.5 text-[9px] font-bold tracking-wider ${
                    workout.is_free
                      ? "bg-blue text-white"
                      : "border border-card-border text-text-secondary"
                  }`}
                >
                  {workout.is_free ? "FREE" : "PREMIUM"}
                </span>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label="Actions"
                onClick={() => setOpenMenuId(openMenuId === workout.id ? null : workout.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full"
              >
                <MoreVertical className="h-4 w-4 text-text-secondary" />
              </button>
              {openMenuId === workout.id && (
                <div className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-button border border-card-border bg-bg-raise shadow-lg">
                  <button
                    type="button"
                    onClick={() => openEdit(workout)}
                    className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-card"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(workout)}
                    className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-card"
                  >
                    {workout.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(workout)}
                    className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-card"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing === "new" ? "New workout" : "Edit workout"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Title">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-button border border-card-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-blue"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-button border border-card-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-blue"
              />
            </Field>

            <div className="flex gap-3">
              <Field label="Level" className="flex-1">
                <select
                  value={form.level}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, level: e.target.value as WorkoutLevel }))
                  }
                  className="w-full rounded-button border border-card-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-blue"
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category" className="flex-1">
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-button border border-card-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-blue"
                />
              </Field>
            </div>

            <Field label="Thumbnail">
              <div className="flex items-center gap-3">
                <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-[10px] bg-bg-raise">
                  {form.thumbnail_url && (
                    <img src={form.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleThumbnailFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={thumbUploading}
                  className="flex items-center gap-2 rounded-button border border-card-border px-3 py-2 text-sm text-text disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {thumbUploading ? "Uploading…" : "Upload image"}
                </button>
                {form.thumbnail_url && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, thumbnail_url: null }))}
                    className="flex items-center gap-2 rounded-button border border-card-border px-3 py-2 text-sm text-red-400 transition hover:bg-bg-raise"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
            </Field>

            {editing === "new" ? (
              <p className="rounded-button border border-card-border bg-bg px-3 py-2 text-xs text-text-secondary">
                Save the workout to unlock video upload.
              </p>
            ) : (
              <Field label="Video">
                <div className="flex items-center gap-3">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoFile(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={videoUploading}
                    className="flex items-center gap-2 rounded-button border border-card-border px-3 py-2 text-sm text-text disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {videoUploading ? "Uploading…" : "Upload video"}
                  </button>
                  {!videoUploading && editing.mux_status === "pending" && (
                    <span className="text-xs text-amber-400">Processing…</span>
                  )}
                  {!videoUploading && editing.mux_status === "ready" && (
                    <span className="text-xs text-success">Ready</span>
                  )}
                  {!videoUploading && editing.mux_status === "errored" && (
                    <span className="text-xs text-red-400">Upload failed</span>
                  )}
                </div>
                {videoUploading && videoProgress !== null && (
                  <div className="mt-2">
                    <div className="h-2 w-full overflow-hidden rounded-pill bg-bg-raise">
                      <div
                        className="h-full rounded-pill bg-blue transition-all"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">{videoProgress}% uploaded</p>
                  </div>
                )}
              </Field>
            )}

            <div className="space-y-2">
              <Toggle
                label="Free"
                checked={form.is_free}
                onChange={(v) => setForm((f) => ({ ...f, is_free: v }))}
              />
              <Toggle
                label="Featured"
                checked={form.is_featured}
                onChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
              />
              <Toggle
                label="Published"
                checked={form.is_published}
                onChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="w-full rounded-button bg-blue py-3 font-semibold text-white transition hover:bg-blue-deep disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-semibold text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-button border border-card-border bg-bg px-3 py-2.5"
    >
      <span className="text-sm text-text">{label}</span>
      <span
        className={`flex h-6 w-10 items-center rounded-pill p-0.5 transition ${
          checked ? "justify-end bg-blue" : "justify-start bg-white/15"
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white" />
      </span>
    </button>
  );
}
