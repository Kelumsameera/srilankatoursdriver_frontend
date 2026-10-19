import type { BlogPost } from "@/types/cms";
import { Section } from "@/components/ui/misc";
import { BlogCard } from "@/components/cards/BlogCard";
import { reveal3d } from "@/lib/reveal";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// "blog" section: the latest blog posts as cards
export function BlogSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const posts = sectionData<BlogPost>(section);
  if (!posts.length) return null;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} ctx={ctx} />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {posts.map((post, index) => (
          <div key={post._id} {...reveal3d(index)}>
            <BlogCard post={post} />
          </div>
        ))}
      </div>
    </Section>
  );
}
