/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fix mapbox-gl worker bundling issue
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl',
    };
    return config;
  },
  transpilePackages: ['mapbox-gl'],
};

export default nextConfig;
