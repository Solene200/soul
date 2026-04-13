import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,  // 关闭构建指示器
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
