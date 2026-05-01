import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  i18n: {
    locales: ['en', 'es', 'hi', 'fr', 'zh', 'pt'],
    defaultLocale: 'en',
  },
};

export default nextConfig;
