import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders CMS Markdown safely: raw HTML is NOT rendered (react-markdown escapes it),
 * and javascript: URLs are stripped by the default URL transform.
 */
export function Markdown({ content, className }: { content?: string; className?: string }) {
  if (!content?.trim()) return null;
  return (
    <div className={cn("prose-cms", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const external = href && /^https?:/i.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
