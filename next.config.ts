import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Escludi docusign-esign dal bundle (server-side only)
  serverExternalPackages: ['docusign-esign'],

  // Webpack configuration per escludere docusign in edge runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('docusign-esign');
    }
    return config;
  },
};

export default nextConfig;
