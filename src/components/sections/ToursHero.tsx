import { getTranslations } from "next-intl/server";
import { ArrowDown, MapPin } from "lucide-react";
import { CmsImage } from "@/components/ui/CmsImage";
import { HeroVideo } from "@/components/site/HeroVideo";
import type { MediaAsset } from "@/types/cms";

export async function ToursHero({ title, subtitle, image, video }: {
  title: string; subtitle?: string; image: MediaAsset; video: MediaAsset;
}) {
  const [tTour, tDestination] = await Promise.all([getTranslations("tour"), getTranslations("destination")]);
  return (
    <section className="relative isolate flex min-h-[36rem] items-end overflow-hidden bg-forest-950 text-white sm:min-h-[42rem] lg:min-h-[46rem]">
      <CmsImage media={image} alt="" preload wrapperClassName="absolute inset-0 -z-20" markIllustrative={false} />
      <HeroVideo src={video.url} className="-z-10" controls />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/40 to-transparent rtl:bg-gradient-to-l" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/85 via-transparent to-forest-950/20" />
      <div className="container-page relative w-full pb-20 pt-36 sm:pb-24 lg:pb-28">
        <div className="mb-6 flex items-center gap-2 text-sm text-white/85"><MapPin className="h-4 w-4 text-gold-400" aria-hidden />Sri Lanka</div>
        <h1 className="max-w-4xl text-balance font-display text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">{title}</h1>
        {subtitle && <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-white/85 sm:text-lg">{subtitle}</p>}
        <a href="#tour-packages" className="mt-8 inline-flex min-h-12 items-center gap-4 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {tDestination("exploreTours")}<ArrowDown className="h-4 w-4" aria-hidden />
        </a>
        <p className="mt-6 max-w-xl text-sm leading-6 text-white/75">{tTour("customise")}</p>
      </div>
    </section>
  );
}
