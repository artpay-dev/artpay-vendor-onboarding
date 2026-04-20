import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['docusign-esign'],
  // Disable Turbopack for production builds (use Webpack instead)
  // This is needed because docusign-esign uses AMD modules not supported by Turbopack
  ...(process.env.NODE_ENV === 'production' && { turbo: undefined }),
};

export default nextConfig;
