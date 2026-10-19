// "use client": videos start and stop as they scroll into view, and react to taps
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, MapPin, MessageCircle, Play, Share2, Volume2, VolumeX } from "lucide-react";
import type { Story } from "@/types/cms";
import { videoPoster, videoUrl } from "@/lib/cloudinary-loader";
import { Link } from "@/i18n/navigation";

// One reel: the story's video filling the frame, with who / what / where and the action buttons on top
function Reel({ story, muted, onToggleMute, shareBase }: { story: Story; muted: boolean; onToggleMute: () => void; shareBase: string }) {
  const t = useTranslations("stories");
  const video = story.media.find((m) => m.resourceType === "video" && m.url);
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  // PLAY only while at least 60% of the reel is on screen; stop (and rewind) when it scrolls away
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().then(() => setPaused(false)).catch(() => setPaused(true));
        } else {
          el.pause();
          el.currentTime = 0;
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!video?.url) return null;

  function togglePlay() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().then(() => setPaused(false)).catch(() => undefined);
    else {
      el.pause();
      setPaused(true);
    }
  }

  async function share() {
    const url = `${shareBase}/stories/${story._id}`;
    if (navigator.share) await navigator.share({ title: story.title, url }).catch(() => undefined);
    else await navigator.clipboard?.writeText(url).catch(() => undefined);
  }

  return (
    <section className="relative flex h-full items-center justify-center bg-forest-950" aria-label={story.title}>
      {/* VIDEO (tap = pause / play) */}
      <video
        ref={ref}
        src={videoUrl(video.url, 720)}
        poster={videoPoster(video.url, 720)}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="h-full w-full max-w-md object-cover sm:rounded-3xl"
      />
      {paused && (
        <button type="button" onClick={togglePlay} className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/85 text-forest-900" aria-label={t("play")}>
          <Play className="h-7 w-7 fill-current" aria-hidden />
        </button>
      )}

      {/* BOTTOM: who, title, where */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-md bg-linear-to-t from-forest-950/90 via-forest-950/40 to-transparent p-5 pe-20 pt-20 text-white sm:rounded-b-3xl">
        <p className="text-sm font-semibold">{story.authorName}</p>
        <h2 className="mt-1 font-display text-xl leading-snug">{story.title}</h2>
        {story.place && (
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-white/80">
            <MapPin className="h-3.5 w-3.5 text-gold-400" aria-hidden /> {story.place}
          </p>
        )}
      </div>

      {/* SIDE BUTTONS: sound, like (on the story page), comments, share */}
      <div className="absolute bottom-6 end-4 flex flex-col items-center gap-4 text-white sm:end-[calc(50%-14rem+1rem)]">
        <button type="button" onClick={onToggleMute} aria-label={muted ? t("unmute") : t("mute")} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
          {muted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
        </button>
        <Link href={`/stories/${story._id}`} className="flex flex-col items-center text-xs" aria-label={t("likeCount", { count: story.likeCount ?? 0 })}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
            <Heart className="h-5 w-5" aria-hidden />
          </span>
          {story.likeCount ?? 0}
        </Link>
        <Link href={`/stories/${story._id}#comments`} className="flex flex-col items-center text-xs" aria-label={t("commentCount", { count: story.commentCount ?? 0 })}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
            <MessageCircle className="h-5 w-5" aria-hidden />
          </span>
          {story.commentCount ?? 0}
        </Link>
        <button type="button" onClick={share} aria-label={t("shareReel")} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
          <Share2 className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </section>
  );
}

/**
 * Vertical "reels" feed: one short guest video per screen, swiped / scrolled one at a time (CSS scroll snap).
 * Videos start muted (browsers only autoplay muted video); one tap on the sound button unmutes all of them.
 */
export function ReelsPlayer({ stories, shareBase }: { stories: Story[]; shareBase: string }) {
  const [muted, setMuted] = useState(true);
  return (
    <div data-reels className="h-[calc(100svh-4rem)] snap-y snap-mandatory overflow-y-auto overscroll-contain bg-forest-950 xl:h-[calc(100svh-5rem)]">
      {stories.map((story) => (
        <div key={story._id} className="h-full snap-start snap-always sm:py-4">
          <Reel story={story} muted={muted} onToggleMute={() => setMuted((m) => !m)} shareBase={shareBase} />
        </div>
      ))}
    </div>
  );
}
