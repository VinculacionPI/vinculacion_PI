/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configure for Chromium binary in serverless
  outputFileTracingIncludes: {
    '/api/flyer': [
      './node_modules/@sparticuz/chromium/bin/**/*',
    ],
  },
  serverExternalPackages: ['@sparticuz/chromium'],
}

export default nextConfig