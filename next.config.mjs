/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return [
      {
        source: "/_next/image",
        has: [
          { type: "query", key: "url", value: ".*\\.(mp4|mov|webm|mkv)$" },
        ],
        destination: "/404",
      },
    ];
  },
};

export default nextConfig;


