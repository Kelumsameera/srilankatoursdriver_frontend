// "use client" is needed because the "Read more" button uses useState.
"use client";

import { useId, useState } from "react";

// Shows the first two lines of a text with a "Read more" / "Read less" button.
// Used for an attraction that has no page of its own to link to.
export function ExpandableText({ text, more, less, title }: { text: string; more: string; less: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  // A unique id so the button can say which paragraph it opens (for screen readers)
  const textId = useId();

  return (
    <>
      {/* TEXT (cut to 2 lines while closed) */}
      <p id={textId} className={`mt-3 whitespace-pre-line break-words text-sm leading-7 text-muted ${isOpen ? "" : "line-clamp-2"}`}>
        {text}
      </p>

      {/* READ MORE / READ LESS */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={textId}
        aria-label={`${isOpen ? less : more}: ${title}`}
        onClick={() => setIsOpen(!isOpen)}
        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-forest-800 underline decoration-gold-400 underline-offset-4 transition-colors duration-200 hover:text-forest-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800"
      >
        {isOpen ? less : more}
      </button>
    </>
  );
}
