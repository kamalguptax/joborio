"use client";

import { sanitizeHtml } from "@/lib/security/sanitizeHtml";
import {
  htmlToPlainText,
  plainTextToBlocks,
  scrubCssNoise,
  stripDangerousBlocks,
} from "@/lib/jobs/formatJobDescription";

type Props = {
  html?: string | null;
  text?: string | null;
  className?: string;
};

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export default function JobDescription({ html, text, className = "" }: Props) {
  const rawHtml = (html ?? "").trim();
  const rawText = (text ?? "").trim();

  if (rawHtml && looksLikeHtml(rawHtml)) {
    const cleaned = sanitizeHtml(stripDangerousBlocks(rawHtml));
    const hasContent = scrubCssNoise(htmlToPlainText(cleaned)).length > 0;
    if (hasContent && cleaned.trim()) {
      return (
        <section className={`job-desc ${className}`.trim()}>
          <h2 className="job-desc__label">Job description</h2>
          <div
            className="job-desc__body"
            dangerouslySetInnerHTML={{ __html: cleaned }}
          />
        </section>
      );
    }
  }

  const source =
    rawText ||
    (rawHtml ? htmlToPlainText(rawHtml) : "") ||
    "";
  const blocks = plainTextToBlocks(source);
  if (blocks.length === 0) return null;

  return (
    <section className={`job-desc ${className}`.trim()}>
      <h2 className="job-desc__label">Job description</h2>
      <div className="job-desc__body">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h3 key={`h-${index}`} className="job-desc__heading">
                {block.text}
              </h3>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={`l-${index}`} className="job-desc__list">
                {block.items.map((item, itemIndex) => (
                  <li key={`li-${index}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={`p-${index}`} className="job-desc__p">
              {block.text}
            </p>
          );
        })}
      </div>
    </section>
  );
}
