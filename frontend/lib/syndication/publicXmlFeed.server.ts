import fs from "fs";
import path from "path";
import type { SyndicatedJob } from "@/lib/api/syndication";

export const PUBLIC_XML_FILENAME = "vigyapanam_en_IN.xml";
export const PUBLIC_FEED_SLUG = "vigyapanam-en-in";

export function publicJobReferenceId(rawId: string): string {
  return `public:${PUBLIC_FEED_SLUG}:${rawId}`;
}

export function parsePublicReferenceId(ref: string): string | null {
  const prefix = `public:${PUBLIC_FEED_SLUG}:`;
  if (!ref.startsWith(prefix)) return null;
  return ref.slice(prefix.length);
}

function publicXmlPath(): string {
  return path.join(process.cwd(), "public", PUBLIC_XML_FILENAME);
}

function cdata(block: string, tag: string): string {
  const cdataRe = new RegExp(
    `<${tag}>(?:\\s*)<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>(?:\\s*)</${tag}>`,
    "i",
  );
  const m = block.match(cdataRe);
  if (m) return m[1].trim();
  const plainRe = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
  const m2 = block.match(plainRe);
  return m2 ? m2[1].trim() : "";
}

function plainText(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text;
}

function mapJobBlock(block: string): SyndicatedJob | null {
  const rawId = cdata(block, "id");
  const title = cdata(block, "title");
  const url = cdata(block, "urlDeeplink") || cdata(block, "url");
  if (!rawId || !title || !url) return null;

  const companyBlock = block.match(/<company>([\s\S]*?)<\/company>/i)?.[1] ?? "";
  const company = cdata(companyBlock, "name") || cdata(block, "company");

  const locBlock =
    block.match(/<locations>([\s\S]*?)<\/locations>/i)?.[1] ??
    block.match(/<location>([\s\S]*?)<\/location>/i)?.[1] ??
    "";
  const city = cdata(locBlock, "city") || cdata(locBlock, "location");
  const state = cdata(locBlock, "state");
  const countryName = cdata(locBlock, "country") || cdata(block, "country");
  const country =
    countryName.toLowerCase() === "india"
      ? "IN"
      : countryName.slice(0, 2).toUpperCase() || "IN";

  const categoryRaw = cdata(block, "category");
  const category = categoryRaw.split(",")[0]?.trim() || "General";

  const descriptionHtml = cdata(block, "description");
  const cpc = cdata(block, "CPC") || "0.03";

  const parts = [city, state, countryName].filter(Boolean);

  return {
    reference_id: publicJobReferenceId(rawId),
    title,
    company,
    location: city || "Remote",
    state,
    country,
    postalcode: cdata(locBlock, "zip"),
    url,
    email: "",
    website: "",
    description_html: descriptionHtml,
    description_text: plainText(descriptionHtml),
    salary: "",
    education: cdata(block, "minimumEducationQualification"),
    jobtype: cdata(block, "jobType"),
    category,
    experience: "",
    publishdate: cdata(block, "timePosted"),
    expirydate: "",
    location_label: parts.join(", ") || countryName || "India",
    ppc_rate_usd: parseFloat(cpc) || 0.03,
  } as SyndicatedJob & { ppc_rate_usd?: number };
}

export type ListPublicJobsOptions = {
  page?: number;
  per_page?: number;
  search?: string;
};

export type ListPublicJobsResult = {
  jobs: SyndicatedJob[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
    source: {
      filename: string;
      publisher?: string;
      lastbuilddate?: string;
    };
  };
};

async function readFeedMeta(): Promise<{
  publisher?: string;
  lastbuilddate?: string;
}> {
  const filePath = publicXmlPath();
  if (!fs.existsSync(filePath)) return {};
  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(8192);
  fs.readSync(fd, buf, 0, 8192, 0);
  fs.closeSync(fd);
  const head = buf.toString("utf8");
  return {
    publisher: cdata(head, "publisher") || undefined,
    lastbuilddate: cdata(head, "lastbuilddate") || undefined,
  };
}

export async function listPublicXmlJobs(
  options: ListPublicJobsOptions = {},
): Promise<ListPublicJobsResult> {
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(Math.max(options.per_page ?? 24, 1), 100);
  const search = (options.search ?? "").trim().toLowerCase();
  const skip = (page - 1) * perPage;

  const filePath = publicXmlPath();
  if (!fs.existsSync(filePath)) {
    return {
      jobs: [],
      meta: {
        page,
        per_page: perPage,
        has_more: false,
        source: { filename: PUBLIC_XML_FILENAME },
      },
    };
  }

  const meta = await readFeedMeta();
  const jobs: SyndicatedJob[] = [];
  let skipped = 0;
  let hasMore = false;

  for await (const block of iterateJobBlocks(filePath)) {
    const job = mapJobBlock(block);
    if (!job) continue;

    if (search) {
      const hay = [
        job.title,
        job.company,
        job.category,
        job.location_label,
        job.description_text,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search)) continue;
    }

    if (skipped < skip) {
      skipped++;
      continue;
    }

    if (jobs.length < perPage) {
      jobs.push(job);
      continue;
    }

    hasMore = true;
    break;
  }

  return {
    jobs,
    meta: {
      page,
      per_page: perPage,
      has_more: hasMore,
      source: {
        filename: PUBLIC_XML_FILENAME,
        publisher: meta.publisher,
        lastbuilddate: meta.lastbuilddate,
      },
    },
  };
}

export async function getPublicXmlJobById(
  rawId: string,
): Promise<SyndicatedJob | null> {
  const filePath = publicXmlPath();
  if (!fs.existsSync(filePath)) return null;

  for await (const block of iterateJobBlocks(filePath)) {
    const id = cdata(block, "id");
    if (id !== rawId) continue;
    return mapJobBlock(block);
  }

  return null;
}

export async function getPublicXmlJobByReference(
  referenceId: string,
): Promise<SyndicatedJob | null> {
  const rawId = parsePublicReferenceId(referenceId);
  if (!rawId) return null;
  return getPublicXmlJobById(rawId);
}

async function* iterateJobBlocks(
  filePath: string,
): AsyncGenerator<string, void, unknown> {
  const stream = fs.createReadStream(filePath, {
    encoding: "utf8",
    highWaterMark: 512 * 1024,
  });

  let buffer = "";

  for await (const chunk of stream) {
    buffer += chunk;

    for (;;) {
      const start = buffer.indexOf("<job>");
      if (start === -1) {
        if (buffer.length > 200_000) {
          buffer = buffer.slice(-50);
        }
        break;
      }

      const end = buffer.indexOf("</job>", start);
      if (end === -1) break;

      const block = buffer.slice(start, end + 6);
      buffer = buffer.slice(end + 6);
      yield block;
    }
  }
}
