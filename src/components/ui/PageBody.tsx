import { Markdown } from "./Markdown";
import { stripMarkdown } from "@/lib/utils";
import { PageBodyDisclosure } from "./PageBodyDisclosure";

/** Page-level Markdown saved in Admin > Pages. */
export function PageBody({ content, disclosure, overlay = false }: { content?: string; disclosure?: { more: string; less: string }; overlay?: boolean }) {
  if (!content?.trim()) return null;
  const expandable = disclosure && stripMarkdown(content, 321).length > 320;
  return (
    <section className={overlay ? "mt-5 max-w-3xl" : disclosure ? "py-6 sm:py-8" : "py-14 sm:py-20"} data-testid="page-body">
      <div className={overlay ? undefined : "container-page max-w-3xl"}>
        {expandable ? (
          <PageBodyDisclosure preview={stripMarkdown(content, 220)} more={disclosure.more} less={disclosure.less} light={overlay}>
            <Markdown content={content} className={overlay ? "text-white/85 [&_h2]:text-white [&_h3]:text-white [&_a]:text-gold-300" : undefined} />
          </PageBodyDisclosure>
        ) : <Markdown content={content} className={overlay ? "text-white/85 [&_h2]:text-white [&_h3]:text-white [&_a]:text-gold-300" : undefined} />}
      </div>
    </section>
  );
}
