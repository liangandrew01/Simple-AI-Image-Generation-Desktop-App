import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // ensures Next.js runs `next export` behavior
  basePath: '', // no custom prefix
  assetPrefix: './'
};

export default nextConfig;
