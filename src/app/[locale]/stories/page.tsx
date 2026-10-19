import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

// Guest stories are shown in the blog's community feed: /stories opens it with the "Stories" menu item selected
export default async function StoriesPage({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/blog?type=stories`);
}
