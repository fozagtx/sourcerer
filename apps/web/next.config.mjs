/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets @sourcerer/db treat SOURCERER_SKIP_DATABASE as web-only (indexer still connects).
  env: {
    SOURCERER_RUNTIME: "web",
  },
  transpilePackages: ["@sourcerer/sdk", "@sourcerer/sdk-evm", "@sourcerer/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack: (config, { dev }) => {
    config.externals.push("pino-pretty", "encoding");
    // Avoid corrupted persistent pack cache (ENOENT *.pack.gz / missing vendor-chunks) during long dev sessions.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
