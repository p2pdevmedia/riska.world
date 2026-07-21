/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // MetaMask SDK conditionally imports this React Native-only storage adapter.
      // Browser builds use the web storage implementation instead.
      "@react-native-async-storage/async-storage": false
    };

    return config;
  }
};

module.exports = nextConfig;
