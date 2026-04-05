// Env vars are validated by src/env.ts, imported on first app-code use.
// If you want build-time validation, add an import("./src/env.ts") via jiti here.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@core/core", "@core/sdk", "@core/auth"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
