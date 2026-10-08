"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Film, ImagePlus, Pencil, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { AdminApiError, adminRequest, api, errorMessage, qs } from "@/lib/admin/api";
import { MEDIA_FOLDERS, checkUploadFile, formatBytes, toAsset, uploadToCloudinary, type MediaFolder, type MediaRecord } from "@/lib/admin/upload";
import { videoPoster } from "@/lib/cloudinary-loader";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/cms";
import { Button, ConfirmDialog, Empty, ErrorBlock, Input, Label, LoadingBlock, Modal, PaginationBar, Select, Textarea } from "./ui";

interface LibraryProps {
  /** When set, the library is in "pick" mode. */
  onPick?: (items: MediaRecord[]) => void;
  multiple?: boolean;
  accept?: "image" | "video" | "any";
  folder?: MediaFolder;
}

export function MediaLibrary({ onPick, multiple, accept = "any", folder: defaultFolder = "general" }: LibraryProps) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | "image" | "video">(accept === "any" ? "" : accept);
  const [folder, setFolder] = useState<MediaFolder>(defaultFolder);
  const [filterFolder, setFilterFolder] = useState("");
  const [selected, setSelected] = useState<MediaRecord[]>([]);
  const [uploads, setUploads] = useState<{ id: number; name: string; pct: number }[]>([]);
  const [editing, setEditing] = useState<MediaRecord | null>(null);
  const [deleting, setDeleting] = useState<MediaRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const uploadSeq = useRef(0);

  const key = ["media", page, search, type, filterFolder];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => api.get<MediaRecord[]>(`/admin/media${qs({ page, limit: 24, search, resourceType: type, folder: filterFolder })}`),
  });

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const all = Array.from(files);
      const list = all.filter((f) => accept === "any" || f.type.startsWith(`${accept}/`));
      if (list.length < all.length) toast.error(`Only ${accept === "video" ? "videos" : "images"} can be used here – ${all.length - list.length} file(s) skipped`);
      if (!list.length) return;
      const done: MediaRecord[] = [];
      for (const file of list) {
        // Ids (not file names) key the progress rows – two files may share a name.
        const id = ++uploadSeq.current;
        setUploads((u) => [...u, { id, name: file.name, pct: 0 }]);
        try {
          const rec = await uploadToCloudinary(file, folder, (pct) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))));
          done.push(rec);
          toast.success(`Uploaded ${file.name}`);
        } catch (err) {
          toast.error(`${file.name}: ${errorMessage(err)}`);
        } finally {
          setUploads((u) => u.filter((x) => x.id !== id));
        }
      }
      await qc.invalidateQueries({ queryKey: ["media"] });
      if (done.length && onPick) setSelected((s) => (multiple ? [...s, ...done] : done.slice(-1)));
    },
    [accept, folder, qc, onPick, multiple],
  );

  const toggle = (m: MediaRecord) =>
    setSelected((s) => (s.some((x) => x._id === m._id) ? s.filter((x) => x._id !== m._id) : multiple ? [...s, m] : [m]));

  const saveMeta = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await api.patch(`/admin/media/${editing._id}`, { title: editing.title, altText: editing.altText, caption: editing.caption, tags: editing.tags });
      toast.success("Media details saved");
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["media"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const replaceFile = async (file: File) => {
    if (!editing) return;
    setBusy(true);
    try {
      checkUploadFile(file, editing.resourceType);
      const form = new FormData();
      form.append("file", file);
      // Goes through the shared client: session refresh, CSRF header and safe error messages.
      const { data: replaced } = await adminRequest<MediaRecord>("POST", `/admin/media/${editing._id}/replace`, form);
      toast.success("File replaced – everywhere it is used now shows the new version");
      setEditing(replaced);
      await qc.invalidateQueries({ queryKey: ["media"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      try {
        await api.del(`/admin/media/${deleting._id}`);
      } catch (err) {
        // 409 = still used by content; the API lists where. Only delete after an explicit second confirmation.
        if (!(err instanceof AdminApiError && err.status === 409)) throw err;
        if (!window.confirm(`${err.message}\n\nDelete it anyway? Those places will show a placeholder.`)) return;
        await api.del(`/admin/media/${deleting._id}?force=true`);
      }
      toast.success("Deleted from Cloudinary and the media library");
      setDeleting(null);
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["media"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const status = useQuery({ queryKey: ["media-status"], queryFn: () => api.get<{ configured: boolean }>("/admin/media/status"), staleTime: 60_000 });
  const canUpload = can("media:create") && status.data?.data.configured !== false;
  const canEdit = can("media:update");
  const items = data?.data ?? [];
  const acceptAttr = accept === "image" ? "image/*" : accept === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*,video/mp4,video/webm,video/quicktime";

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (canUpload) void upload(e.dataTransfer.files);
      }}
    >
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search title, filename, alt text, tags…"
            aria-label="Search media"
            className="ps-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {accept === "any" && (
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as "" | "image" | "video");
              setPage(1);
            }}
            className="w-32"
            aria-label="Type"
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </Select>
        )}
        <Select
          value={filterFolder}
          onChange={(e) => {
            setFilterFolder(e.target.value);
            setPage(1);
          }}
          className="w-40"
          aria-label="Filter folder"
        >
          <option value="">All folders</option>
          {MEDIA_FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        {can("media:create") && (
          <>
            <Select value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder)} className="w-40" aria-label="Upload folder" title="Upload into folder">
              {MEDIA_FOLDERS.map((f) => (
                <option key={f} value={f}>
                  Upload to: {f}
                </option>
              ))}
            </Select>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={acceptAttr}
              className="hidden"
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = ""; // allow picking the same file again
                if (files.length) void upload(files);
              }}
              data-testid="media-file-input"
            />
            <Button onClick={() => fileInput.current?.click()} disabled={!canUpload || uploads.length > 0} title={canUpload ? undefined : "Uploads are disabled until Cloudinary is configured"}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </>
        )}
      </div>

      {status.data && !status.data.data.configured && (
        <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" data-testid="cloudinary-missing">
          Cloudinary is not configured, so uploads are disabled. Add <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code> and{" "}
          <code>CLOUDINARY_API_SECRET</code> to <code>backend/.env</code> and restart the API.
        </div>
      )}
      {uploads.length > 0 && (
        <div className="mb-4 space-y-2" aria-live="polite">
          {uploads.map((u) => (
            <div key={u.id} className="rounded-lg bg-slate-50 p-2 text-xs">
              <div className="mb-1 flex justify-between">
                <span className="truncate">{u.name}</span>
                <span>{u.pct}%</span>
              </div>
              <div className="h-1.5 rounded bg-slate-200" role="progressbar" aria-label={`Uploading ${u.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.pct}>
                <div className="h-full rounded bg-forest-600 transition-all" style={{ width: `${u.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <Empty>
          <ImagePlus className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          No media yet. Drag & drop files here or click Upload. Files are stored on Cloudinary.
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" data-testid="media-grid">
          {items.map((m) => {
            const isSel = selected.some((s) => s._id === m._id);
            const thumb = m.resourceType === "video" ? videoPoster(m.secureUrl, 400) : m.secureUrl;
            return (
              <li key={m._id} className="group relative">
                <button
                  type="button"
                  onClick={() => (onPick ? toggle(m) : setEditing(m))}
                  className={cn("relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-slate-100", isSel ? "border-forest-600" : "border-transparent hover:border-slate-300")}
                  title={m.title || m.originalFilename}
                  aria-pressed={onPick ? isSel : undefined}
                  aria-label={`${onPick ? "Select" : "Edit"} ${m.title || m.originalFilename || "media"}`}
                >
                  <Image src={thumb} alt={m.altText || ""} fill sizes="200px" className="object-cover" />
                  {m.resourceType === "video" && <Film className="absolute start-2 top-2 h-5 w-5 rounded bg-black/60 p-0.5 text-white" />}
                  {isSel && <Check className="absolute end-2 top-2 h-6 w-6 rounded-full bg-forest-600 p-1 text-white" />}
                </button>
                {/* A sibling, not nested: a button inside a button is invalid and unreachable by keyboard. */}
                {onPick && (
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    className="absolute bottom-7 end-2 hidden rounded bg-white/90 p-1 text-slate-700 focus:block group-focus-within:block group-hover:block"
                    aria-label={`Edit details of ${m.title || m.originalFilename || "media"}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <p className="mt-1 truncate text-xs text-slate-500">{m.title || m.originalFilename}</p>
              </li>
            );
          })}
        </ul>
      )}
      {data?.meta && data.meta.totalPages > 1 && <PaginationBar page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}

      {onPick && (
        <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-500">{selected.length} selected</span>
          <Button disabled={!selected.length} onClick={() => onPick(selected)} data-testid="media-use-selected">
            Use selected
          </Button>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Media details"
        wide
        footer={
          <>
            {can("media:delete") && (
              <Button variant="danger" className="me-auto" onClick={() => setDeleting(editing)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            {canEdit && (
              <Button onClick={saveMeta} loading={busy}>
                Save
              </Button>
            )}
          </>
        }
      >
        {editing && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                {editing.resourceType === "video" ? (
                  <video src={editing.secureUrl} controls className="h-full w-full object-contain" />
                ) : (
                  <Image src={editing.secureUrl} alt={editing.altText || ""} fill sizes="500px" className="object-contain" />
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-500">
                <dt>Type</dt>
                <dd>
                  {editing.resourceType} / {editing.format}
                </dd>
                <dt>Size</dt>
                <dd>{formatBytes(editing.bytes)}</dd>
                {editing.width && (
                  <>
                    <dt>Dimensions</dt>
                    <dd>
                      {editing.width} × {editing.height}
                    </dd>
                  </>
                )}
                {editing.duration ? (
                  <>
                    <dt>Duration</dt>
                    <dd>{editing.duration.toFixed(1)} s</dd>
                  </>
                ) : null}
                <dt>Folder</dt>
                <dd className="truncate">{editing.folder}</dd>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(editing.secureUrl);
                    toast.success("URL copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy URL
                </Button>
                {canEdit && (
                  <>
                    <input
                      ref={replaceInput}
                      type="file"
                      accept={editing.resourceType === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void replaceFile(file);
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => replaceInput.current?.click()} loading={busy}>
                      <RefreshCw className="h-3.5 w-3.5" /> Replace file
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="m-title">Title</Label>
                <Input id="m-title" disabled={!canEdit} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m-alt" hint="Describe the image for screen readers & SEO">
                  Alt text
                </Label>
                <Input id="m-alt" disabled={!canEdit} value={editing.altText ?? ""} onChange={(e) => setEditing({ ...editing, altText: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m-caption">Caption</Label>
                <Textarea id="m-caption" disabled={!canEdit} value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m-tags" hint="comma separated">
                  Tags
                </Label>
                <Input
                  id="m-tags" disabled={!canEdit}
                  value={(editing.tags ?? []).join(", ")}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete media?"
        message="The file will be permanently removed from Cloudinary. Content that still uses it will show a placeholder."
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
        loading={busy}
      />
    </div>
  );
}

/** Single media field (image or video) used inside admin forms. */
export function MediaField({
  value,
  onChange,
  accept = "image",
  folder = "general",
  label,
}: {
  value?: MediaAsset | null;
  onChange: (v: MediaAsset | null) => void;
  accept?: "image" | "video" | "any";
  folder?: MediaFolder;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const thumb = value?.url ? (value.resourceType === "video" ? videoPoster(value.url, 400) : value.url) : null;
  return (
    <div>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-forest-600"
          aria-label={label ? `Choose ${label}` : "Choose media"}
        >
          {thumb ? <Image src={thumb} alt={value?.alt ?? ""} fill sizes="150px" className="object-cover" /> : <ImagePlus className="h-6 w-6" />}
          {value?.resourceType === "video" && <Film className="absolute start-1 top-1 h-4 w-4 text-white drop-shadow" />}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              {value?.url ? "Change" : "Select / upload"}
            </Button>
            {value?.url && (
              <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
                Remove
              </Button>
            )}
          </div>
          {value?.url && (
            <Input placeholder="Alt text" value={value.alt ?? ""} onChange={(e) => onChange({ ...value, alt: e.target.value })} aria-label="Alt text" />
          )}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Media library" wide>
        <MediaLibrary
          accept={accept}
          folder={folder}
          onPick={(items) => {
            if (items[0]) onChange(toAsset(items[0]));
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

/** Multiple media (galleries). Supports reordering and removal. */
export function MediaListField({ value, onChange, folder = "general", accept = "image" }: { value?: MediaAsset[]; onChange: (v: MediaAsset[]) => void; folder?: MediaFolder; accept?: "image" | "video" | "any" }) {
  const [open, setOpen] = useState(false);
  const list = value ?? [];
  const move = (i: number, d: number) => {
    const next = [...list];
    const [x] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + d)), 0, x);
    onChange(next);
  };
  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-2">
        {list.map((m, i) => (
          <li key={`${m.publicId}-${i}`} className="group relative h-20 w-28 overflow-hidden rounded-lg bg-slate-100">
            {m.url && <Image src={m.resourceType === "video" ? videoPoster(m.url, 300) : m.url} alt={m.alt ?? ""} fill sizes="120px" className="object-cover" />}
            <div className="absolute inset-x-0 bottom-0 hidden justify-between bg-black/60 p-1 text-[10px] text-white group-focus-within:flex group-hover:flex">
              <button type="button" onClick={() => move(i, -1)} aria-label="Move left">
                ◀
              </button>
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove">
                ✕
              </button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Move right">
                ▶
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ImagePlus className="h-4 w-4" /> Add media
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Media library" wide>
        <MediaLibrary
          multiple
          accept={accept}
          folder={folder}
          onPick={(items) => {
            onChange([...list, ...items.map(toAsset)]);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
