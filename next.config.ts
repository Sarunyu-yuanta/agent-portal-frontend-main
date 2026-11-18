import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/th/command-center",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/th/command-center/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
