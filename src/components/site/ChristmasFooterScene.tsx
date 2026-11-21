import Image from "next/image";
import { RealisticChristmasSleigh } from "./RealisticChristmasSleigh";

const GREETINGS: Record<string, string> = {
  en: "Merry Christmas from Sri Lanka!",
  si: "ශ්‍රී ලංකාවේ සිට සුබ නත්තලක් වේවා!",
  ta: "இலங்கையிலிருந்து இனிய கிறிஸ்துமஸ் வாழ்த்துக்கள்!",
  de: "Frohe Weihnachten aus Sri Lanka!",
  fr: "Joyeux Noël depuis le Sri Lanka !",
  es: "¡Feliz Navidad desde Sri Lanka!",
  it: "Buon Natale dallo Sri Lanka!",
  pt: "Feliz Natal do Sri Lanka!",
  ru: "С Рождеством из Шри-Ланки!",
  ja: "スリランカからメリークリスマス！",
  ko: "스리랑카에서 메리 크리스마스!",
  zh: "来自斯里兰卡的圣诞快乐！",
  ar: "عيد ميلاد مجيد من سريلانكا!",
  hi: "श्रीलंका से क्रिसमस की शुभकामनाएं!",
};

/** Photographic landscape with a separate galloping sleigh sprite and global snowfall. */
export function ChristmasFooterScene({ locale }: { locale: string }) {
  const greeting = GREETINGS[locale] ?? GREETINGS.en;
  return (
    <div aria-hidden="true" className="xmas-scene relative isolate h-75 overflow-hidden bg-[#100609] sm:h-95 lg:h-105">
      <Image
        src="/images/christmas-mountains-night.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[28%_bottom] sm:object-center"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/25 via-transparent to-transparent" />
      <div className="xmas-footer-flight absolute left-0 top-[32%] z-1 w-55 sm:top-[29%] sm:w-75">
        <RealisticChristmasSleigh />
      </div>
      {/* greeting */}
      <div className="relative flex h-full flex-col items-center justify-start px-4 pt-5 text-center sm:pt-7">
        <p className="font-display text-2xl text-gold-400 sm:text-4xl" style={{ textShadow: "0 2px 12px rgb(0 0 0 / 0.7)" }}>{greeting}</p>
        <p className="mt-2 text-xs tracking-wide text-white/85 sm:text-sm" style={{ textShadow: "0 1px 6px rgb(0 0 0 / 0.9)" }}>සුබ නත්තලක් · இனிய கிறிஸ்துமஸ் · Merry Christmas</p>
      </div>
    </div>
  );
}
