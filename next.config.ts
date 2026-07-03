import type { NextConfig } from "next";

function stickerRemotePatterns() {
  const base = process.env.NEXT_PUBLIC_STICKER_ASSET_BASE_URL?.trim();
  if (!base) return [];

  try {
    const url = new URL(base);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...stickerRemotePatterns(),
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
