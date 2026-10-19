import { permanentRedirect } from "next/navigation";
import type { SearchParams } from "@/components/site/listing";

type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

// The community feed now lives on the blog page: old /community links (with ?q / ?type) move there
export default async function CommunityPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string" && ["q", "type", "category"].includes(key)) query.set(key, value);
  }
  const qs = query.toString();
  permanentRedirect(`/${locale}/blog${qs ? `?${qs}` : ""}`);
}
