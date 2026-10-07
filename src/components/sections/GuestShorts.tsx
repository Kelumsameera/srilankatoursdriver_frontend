"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { GuestShort } from "@/types/cms";
import { embedUrl } from "@/lib/utils";
import { videoPoster, videoUrl } from "@/lib/cloudinary-loader";

/** Vertical video cards; embeds load only after the visitor clicks (fast pages, no third-party cookies up front). */
export function GuestShortsGrid({ shorts }: { shorts: GuestShort[] }) {
  return (
    <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4">
      {shorts.map((s) => (
        <li key={s._id} className="w-64 shrink-0 snap-start sm:w-auto">
          <ShortCard short={s} />
        </li>
      ))}
    </ul>
  );
}

function ShortCard({ short }: { short: GuestShort }) {
  const [playing, setPlaying] = useState(false);
  const uploaded = short.platform === "upload" ? short.uploadedMedia?.url : undefined;
  const embed = uploaded ? null : embedUrl(short.platform, short.videoUrl);
  const poster = short.thumbnail?.url ?? (uploaded ? videoPoster(uploaded, 600) : undefined);

  return (
    <figure className="overflow-hidden rounded-3xl bg-forest-900 text-white shadow-card">
      <div className="relative aspect-[9/16]">
        {playing ? (
          uploaded ? (
            <video src={videoUrl(uploaded, 720)} controls autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
          ) : embed ? (
            <iframe
              src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
              title={short.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          ) : null
        ) : (
          <button
            type="button"
            onClick={() => (uploaded || embed ? setPlaying(true) : short.videoUrl && window.open(short.videoUrl, "_blank", "noopener"))}
            className="group absolute inset-0 flex items-center justify-center"
            aria-label={short.title}
          >
            {poster ? (
              <Image src={poster} alt="" fill sizes="(min-width:1024px) 25vw, 256px" className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1f7a4d,#08261a)]" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent" />
            <span className="relative rounded-full bg-white/90 p-4 text-forest-900 shadow-xl transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 fill-current" />
            </span>
          </button>
        )}
      </div>
      <figcaption className="p-4">
        <p className="line-clamp-1 font-medium">{short.title}</p>
        {(short.guestName || short.country) && <p className="text-xs text-white/60">{[short.guestName, short.country].filter(Boolean).join(" · ")}</p>}
      </figcaption>
    </figure>
  );
}
