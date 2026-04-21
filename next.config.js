/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      '@hyperlane-xyz/sdk': './lib/stubs/empty.js',
      '@hyperlane-xyz/registry': './lib/stubs/empty.js',
      '@hyperlane-xyz/utils': './lib/stubs/empty.js',
      '@solana/web3.js': './lib/stubs/empty.js',
    },
  },
}

module.exports = nextConfig