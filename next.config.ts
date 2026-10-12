import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conventional dynamic rendering: dashboard + API always read fresh from
  // Supabase. (Scaffold's experimental cacheComponents/partialPrefetching removed
  // for predictable behavior and compatibility with `export const dynamic`.)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
