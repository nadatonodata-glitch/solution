import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // PWA Configuration (nếu dùng next-pwa)
  // Cần cài: npm install next-pwa
  // Uncomment phần dưới nếu muốn dùng next-pwa với Service Worker
  
  
  // @ts-ignore
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  },
  
};

export default nextConfig;