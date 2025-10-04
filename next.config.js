/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove experimental.appDir - it's no longer needed in Next.js 13+
  // Remove the env property - it can interfere with NEXT_PUBLIC_ variables
}

module.exports = nextConfig