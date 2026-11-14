import type { NextConfig } from "next";

const staticExport = process.env.NEXT_OUTPUT_EXPORT === "1";
const standalone = process.env.NEXT_STANDALONE === "1";

const outputMode =
  standalone ? "standalone" : staticExport ? "export" : undefined;

const nextConfig: NextConfig = {
  ...(outputMode ? { output: outputMode } : {}),
  ...(outputMode === "export"
    ? {
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
