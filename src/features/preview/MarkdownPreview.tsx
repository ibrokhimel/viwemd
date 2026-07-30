import type { ReactElement } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details",
    "summary",
    "kbd",
    "mark",
    "sub",
    "sup",
    "abbr",
  ],
  attributes: {
    ...defaultSchema.attributes,
    abbr: ["title"],
    details: ["open"],
  },
};

interface MarkdownPreviewProps {
  source: string;
}

export function MarkdownPreview({
  source,
}: MarkdownPreviewProps): ReactElement {
  return (
    <article className="markdown-preview" aria-label="Markdown preview">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, schema],
          [rehypeSlug, { prefix: "user-content-" }],
        ]}
      >
        {source}
      </Markdown>
    </article>
  );
}
