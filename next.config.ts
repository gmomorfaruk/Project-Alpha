import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    const adminSecret = process.env.ADMIN_SECRET_PATH || 'admin-secret-xyz';
    const adminSubdomain = process.env.ADMIN_SUBDOMAIN;

    const rules = [];

    // 1. Subdomain rewriting (if configured)
    if (adminSubdomain) {
      rules.push({
        source: '/:path((?!_next|api|favicon.ico|.*\\.).*)',
        has: [
          {
            type: 'host' as const,
            value: adminSubdomain,
          },
        ],
        destination: '/admin/:path',
      });
      // Handle the root page of the subdomain specifically
      rules.push({
        source: '/',
        has: [
          {
            type: 'host' as const,
            value: adminSubdomain,
          },
        ],
        destination: '/admin',
      });
    }

    // 2. Secret path fallback routing (always enabled)
    rules.push({
      source: `/${adminSecret}`,
      destination: '/admin',
    });
    rules.push({
      source: `/${adminSecret}/:path*`,
      destination: '/admin/:path*',
    });

    return rules;
  },
};

export default nextConfig;
