import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1751707312528.cluster-bg6uurscprhn6qxr6xwtrhvkf6.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;
