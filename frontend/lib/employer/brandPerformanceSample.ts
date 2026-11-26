/** Sample Campaign Performance data from Brand Portal Design.html */

export type PerfCampaignOption = {
  id: string;
  name: string;
  clicks: number;
  raw: number;
  appr: number;
  spent: number;
  price: number;
};

export const SAMPLE_PERF_CAMPAIGNS: PerfCampaignOption[] = [
  {
    id: "JO-C-24081",
    name: "CNC Operator Hiring, Pune",
    clicks: 18420,
    raw: 1480,
    appr: 1105,
    spent: 93925,
    price: 85,
  },
  {
    id: "JO-C-24077",
    name: "Full-Stack Bootcamp Cohort 12",
    clicks: 24310,
    raw: 3120,
    appr: 2090,
    spent: 135850,
    price: 65,
  },
  {
    id: "JO-C-24072",
    name: "Data Analytics Weekend Batch",
    clicks: 15980,
    raw: 1900,
    appr: 1240,
    spent: 107880,
    price: 87,
  },
  {
    id: "JO-C-24066",
    name: "Lumen AI Notes Free Trial",
    clicks: 6200,
    raw: 410,
    appr: 262,
    spent: 22270,
    price: 85,
  },
  {
    id: "JO-C-24090",
    name: "Smart Hackathon 2027",
    clicks: 9800,
    raw: 720,
    appr: 510,
    spent: 40800,
    price: 80,
  },
];

export const SAMPLE_SOURCE_ROWS = [
  {
    channel: "Messaging communities",
    geo: "South India",
    traffic: "Organic",
    share: "38%",
    approval: "72%",
    quality: "High",
    pill: "bg-emerald-50 text-emerald-700",
  },
  {
    channel: "Social media channels",
    geo: "North India",
    traffic: "Organic",
    share: "27%",
    approval: "66%",
    quality: "High",
    pill: "bg-emerald-50 text-emerald-700",
  },
  {
    channel: "Job and career websites",
    geo: "West India",
    traffic: "Referral",
    share: "21%",
    approval: "61%",
    quality: "Medium",
    pill: "bg-amber-50 text-amber-800",
  },
  {
    channel: "Newsletters",
    geo: "Pan-India",
    traffic: "Email",
    share: "14%",
    approval: "58%",
    quality: "Medium",
    pill: "bg-amber-50 text-amber-800",
  },
];

export function buildPerfTiles(c: {
  clicks: number;
  raw: number;
  appr: number;
  spent: number;
}) {
  const unique = Math.round(c.clicks * 0.91);
  const verified = Math.round(c.raw * 0.8);
  const rejected = Math.max(0, c.raw - c.appr);
  const convRate = c.clicks > 0 ? ((c.raw / c.clicks) * 100).toFixed(1) : "0.0";
  const inr = new Intl.NumberFormat("en-IN");

  return [
    {
      l: "Clicks",
      v: inr.format(c.clicks),
      n: "Impressions not measured for this account",
    },
    {
      l: "Unique clicks",
      v: inr.format(unique),
      n: "After duplicate filtering",
    },
    {
      l: "Raw conversions",
      v: inr.format(c.raw),
      n: "Received, not yet billable",
    },
    {
      l: "Verified",
      v: inr.format(verified),
      n: "Verified is not the same as approved",
    },
    {
      l: "Approved",
      v: inr.format(c.appr),
      n: "Billable",
    },
    {
      l: "Rejected",
      v: inr.format(rejected),
      n: "With reasons",
    },
    {
      l: "Spend",
      v: `₹${inr.format(Math.round(c.spent))}`,
      n: "Approved only",
    },
    {
      l: "Conversion rate",
      v: `${convRate}%`,
      n: "Raw divided by clicks",
    },
  ];
}
