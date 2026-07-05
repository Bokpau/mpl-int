/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/results',
        destination: '/matches',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
