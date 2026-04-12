/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm', 'remark-parse', 'unified', 'vfile', 'bail', 'is-plain-obj', 'trough', 'vfile-message', 'unist-util-stringify-position'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
        pathname: '**',
      },
    ],
  },
    turbopack: {},
}

export default nextConfig