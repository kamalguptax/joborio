import fs from "node:fs";

const src = new URL("../public/vigyapanam_en_IN.xml", import.meta.url);
const dest = new URL("../public/home-jobs.json", import.meta.url);
const WANT = 24;

function field(block, tag) {
  const re = new RegExp(
    `<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))\\s*</${tag}>`,
    "i",
  );
  const match = block.match(re);
  return (match?.[1] ?? match?.[2] ?? "").replace(/\s+/g, " ").trim();
}

function parseJob(block) {
  const companyBlock = block.match(/<company>([\s\S]*?)<\/company>/i)?.[1] ?? "";
  const locationBlock = block.match(/<locations>([\s\S]*?)<\/locations>/i)?.[1] ?? block;
  const title = field(block, "title");
  const id = field(block, "id") || field(block, "reference_id");
  if (!title || !id) return null;

  const company = field(companyBlock, "name") || field(block, "company") || "Partner";
  const city = field(locationBlock, "city") || field(locationBlock, "location") || field(block, "location");
  const country = field(locationBlock, "country") || field(block, "country") || "India";
  const description = field(block, "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return {
    reference_id: id,
    title,
    company,
    location: city,
    state: field(locationBlock, "state") || field(block, "state"),
    country,
    postalcode: field(locationBlock, "zip"),
    url: field(block, "urlDeeplink") || field(block, "url"),
    email: "",
    website: "",
    description_html: "",
    description_text: description.slice(0, 400),
    salary: "",
    education: "",
    jobtype: field(block, "jobType") || field(block, "jobtype") || "Full-time",
    category: field(block, "category") || "Opportunity",
    experience: "",
    publishdate: field(block, "timePosted"),
    expirydate: "",
    location_label: [city, country].filter(Boolean).join(", ") || "Remote",
  };
}

const stream = fs.createReadStream(src, { encoding: "utf8", highWaterMark: 256 * 1024 });
let buf = "";
const jobs = [];

stream.on("data", (chunk) => {
  buf += chunk;
  let closeAt = buf.indexOf("</job>");
  while (closeAt !== -1) {
    const openAt = buf.lastIndexOf("<job>", closeAt);
    if (openAt !== -1) {
      const job = parseJob(buf.slice(openAt, closeAt));
      if (job) jobs.push(job);
    }
    buf = buf.slice(closeAt + 6);
    if (jobs.length >= WANT) {
      stream.destroy();
      return;
    }
    closeAt = buf.indexOf("</job>");
  }
  const openAt = buf.lastIndexOf("<job>");
  if (openAt > 0) buf = buf.slice(openAt);
});

stream.on("close", () => {
  fs.writeFileSync(dest, JSON.stringify(jobs, null, 2));
  console.log(`Wrote ${jobs.length} jobs`);
});

stream.on("error", (error) => {
  if (error.code === "ERR_STREAM_PREMATURE_CLOSE") return;
  console.error(error);
  process.exitCode = 1;
});
