/**
 * Minimal allowlist HTML sanitizer for third-party job descriptions (XML feeds).
 * Browser-only (uses DOMParser). On the server it returns escaped plain text,
 * so unsanitized markup is never emitted.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "div", "span",
  "strong", "b", "em", "i", "u", "s", "small", "sub", "sup", "blockquote",
  "ul", "ol", "li", "dl", "dt", "dd",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "pre", "code",
]);

/** Tags removed together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed", "noscript", "template",
  "svg", "math", "form", "link", "meta", "base", "textarea", "select",
]);

const SAFE_HREF = /^(https?:|mailto:|tel:)/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanNode(node: Node, doc: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (DROP_WITH_CONTENT.has(tag)) return null;

  const fragment = doc.createDocumentFragment();
  el.childNodes.forEach((child) => {
    const cleaned = cleanNode(child, doc);
    if (cleaned) fragment.appendChild(cleaned);
  });

  // Unknown tag: keep its (already cleaned) children, drop the wrapper.
  if (!ALLOWED_TAGS.has(tag)) return fragment;

  const out = doc.createElement(tag);
  if (tag === "a") {
    const href = (el.getAttribute("href") ?? "").trim();
    if (SAFE_HREF.test(href)) {
      out.setAttribute("href", href);
      out.setAttribute("target", "_blank");
      out.setAttribute("rel", "noopener noreferrer nofollow");
    }
  }
  if (tag === "td" || tag === "th") {
    for (const attr of ["colspan", "rowspan"]) {
      const v = el.getAttribute(attr);
      if (v && /^\d{1,3}$/.test(v)) out.setAttribute(attr, v);
    }
  }
  out.appendChild(fragment);
  return out;
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  const pre = dirty
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeHtml(pre);
  }
  const parsed = new DOMParser().parseFromString(pre, "text/html");
  const out = document.implementation.createHTMLDocument("");
  const container = out.createElement("div");
  parsed.body.childNodes.forEach((child) => {
    const cleaned = cleanNode(child, out);
    if (cleaned) container.appendChild(cleaned);
  });
  return container.innerHTML;
}
