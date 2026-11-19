/** Strip style/script/comments before any other HTML handling. */
export function stripDangerousBlocks(html: string): string {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?(?:xml|meta|link|head|body|html)\b[^>]*>/gi, " ");
}

/** Remove CSS rule noise that often leaks from feed HTML into plain text. */
export function scrubCssNoise(text: string): string {
  return text
    .replace(/\{[^{}]{0,500}\}/g, " ")
    .replace(
      /\b(?:text-decoration|background(?:-color)?|border(?:-\w+)?|color|font(?:-\w+)?|margin(?:-\w+)?|padding(?:-\w+)?|line-height|letter-spacing|display|width|height|max-width|min-width|float|clear|vertical-align|white-space|list-style(?:-\w+)?|table-layout|border-collapse|box-sizing)\s*:\s*[^;{}\n]{0,120};?/gi,
      " ",
    )
    .replace(/\b(?:tr|th|td|table|thead|tbody|a|p|div|span|ul|li|h[1-6])\s*\{/gi, " ")
    .replace(/\[\s*[^\]]{0,200}\]/g, (chunk) =>
      /text-decoration|background|border|color\s*:/i.test(chunk) ? " " : chunk,
    )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function htmlToPlainText(html: string): string {
  const cleaned = stripDangerousBlocks(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(?:p|div|h[1-6]|li|tr)\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");
  return scrubCssNoise(
    cleaned
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'"),
  );
}

export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/** Turn messy plain text into readable blocks for the job page. */
export function plainTextToBlocks(raw: string): DescriptionBlock[] {
  const text = scrubCssNoise(raw);
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  // If the feed flattened everything to one line, split on sentence boundaries
  // near common section labels.
  const expanded =
    lines.length === 1 && lines[0].length > 280
      ? lines[0]
          .replace(
            /\s+(?=(?:About|The Role|Responsibilities|Requirements|Qualifications|What you(?:'ll| will)|Who you|Benefits|Location|Equal|We are|We're|Our|Role overview)\b)/gi,
            "\n\n",
          )
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
      : lines;

  const blocks: DescriptionBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  for (const line of expanded) {
    const bullet = line.match(/^(?:[-*•●▪]|(\d+)[.)])\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[2] ?? line.replace(/^(?:[-*•●▪]|\d+[.)])\s+/, ""));
      continue;
    }

    flushList();

    const isHeading =
      (line.length <= 72 && /[:：]$/.test(line)) ||
      (line.length <= 48 &&
        /^[A-Z0-9][A-Z0-9 &/'’-]{2,}$/.test(line) &&
        !/[.!?]$/.test(line)) ||
      /^(?:About|The Role|Responsibilities|Requirements|Qualifications|Benefits|Equal Opportunity|Who you are|What you(?:'ll| will) do)\b/i.test(
        line,
      );

    if (isHeading) {
      blocks.push({ type: "heading", text: line.replace(/[:：]$/, "") });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  flushList();
  return blocks;
}
