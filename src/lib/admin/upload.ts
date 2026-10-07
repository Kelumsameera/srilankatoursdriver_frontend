"use client";

import { api } from "./api";
import type { MediaAsset } from "@/types/cms";

export interface MediaRecord {
  _id: string;
  publicId: string;
  secureUrl: string;
  resourceType: "image" | "video";
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes?: number;
  folder?: string;
  originalFilename?: string;
  altText?: string;
  title?: string;
  caption?: string;
  tags?: string[];
  createdAt?: string;
}

export const MEDIA_FOLDERS = [
  "branding",
  "hero",
  "tours",
  "destinations",
  "excursions",
  "vehicles",
  "gallery",
  "blog",
  "guest-shorts",
  "reviews",
  "seo",
  "pages",
  "general",
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;

interface Signature {
  timestamp: number;
  folder: string;
  allowed_formats: string;
  signature: string;
  apiKey: string;
  uploadUrl: string;
}

/**
 * Signed direct upload: Browser → Cloudinary (bytes never pass through our API),
 * then the API verifies the asset with Cloudinary and stores the metadata in MongoDB.
 * The Cloudinary API secret never reaches the browser.
 */
export async function uploadToCloudinary(file: File, folder: MediaFolder, onProgress?: (pct: number) => void): Promise<MediaRecord> {
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error(`${file.name}: only images and videos are allowed`);
  if (file.size > (resourceType === "video" ? MAX_VIDEO : MAX_IMAGE)) {
    throw new Error(`${file.name} is too large (max ${resourceType === "video" ? "200" : "15"} MB)`);
  }
  const { data: sig } = await api.post<Signature>("/admin/media/signature", { folder, resourceType });

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowed_formats);

  const uploaded = await new Promise<{ public_id: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sig.uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(new Error(json?.error?.message ?? `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });

  const title = file.name.replace(/\.[^.]+$/, "");
  const { data } = await api.post<MediaRecord>("/admin/media", { publicId: uploaded.public_id, resourceType, title, altText: title });
  return data;
}

export function toAsset(m: MediaRecord): MediaAsset {
  return {
    mediaId: m._id,
    publicId: m.publicId,
    url: m.secureUrl,
    resourceType: m.resourceType,
    format: m.format,
    width: m.width ?? null,
    height: m.height ?? null,
    duration: m.duration ?? null,
    alt: m.altText ?? "",
  };
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
