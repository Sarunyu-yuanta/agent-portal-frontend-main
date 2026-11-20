import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Legacy `/dashboard` links. No locale here: `src/proxy.ts` adds the
  // visitor's language to the target.
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/command-center",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/command-center/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
