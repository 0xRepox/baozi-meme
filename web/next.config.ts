import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@anthropic-ai/sdk"],
  webpack(webpackConfig) {
    // Suppress dynamic expression warning from ox/viem via @walletconnect
    webpackConfig.ignoreWarnings = [
      { module: /ox\/_esm\/tempo/ },
    ];
    return webpackConfig;
  },
};

export default config;
