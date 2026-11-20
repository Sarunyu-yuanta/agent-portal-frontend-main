import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Origin of the backend, so the browser may call it under `connect-src`. */
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "").origin;
  } catch {
    return "";
  }
}

/**
 * Content-Security-Policy without nonces (see Next's CSP guide). Next's own
 * inline bootstrap scripts need `'unsafe-inline'`; moving to a nonce-based
 * policy is listed as tech debt in docs/architecture.md.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Google Fonts: `@sarunyu/system-one/styles.css` @imports Noto Sans Thai
  // from there; without it the button and link weights fall back.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data:",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' ${apiOrigin()}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework (`X-Powered-By: Next.js`).
  poweredByHeader: false,
  // Stated explicitly: shipping source maps would publish the original source.
  productionBrowserSourceMaps: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

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
