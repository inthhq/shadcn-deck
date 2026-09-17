import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	cacheComponents: true,
	logging: {
		browserToTerminal: true,
	},

	experimental: {
		// Enable support for `global-not-found`, which allows you to more easily define a global 404 page.
		globalNotFound: true,

		inlineCss: true,
	},
};

export default nextConfig;
