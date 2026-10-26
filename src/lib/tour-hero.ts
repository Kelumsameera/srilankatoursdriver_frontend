import type { MediaAsset } from "@/types/cms";

/** Licensed coastal footage and bundled clips; category-specific CMS footage takes precedence. */
export function tourHeroMedia(category?: string, video?: MediaAsset | null) {
  const scene = /hill|ella|tea|adventure/.test(category ?? "") ? "ella"
    : /cultur|heritage|sigiriya|ramayana/.test(category ?? "") ? "sigiriya"
    : !category || /down-south|beach|coast|honeymoon/.test(category) ? "sri-lanka-fishing" : "mirissa";
  return {
    video: video?.url && video.resourceType === "video" ? video : { url: `/videos/tours/${scene}.mp4`, resourceType: "video" as const },
    poster: { url: `/videos/tours/${scene}-poster.webp`, resourceType: "image" as const },
  };
}
