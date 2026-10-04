const storeUrl = new URL(
	'../../src/pkgs/deck/core/store/presentation-store.ts',
	import.meta.url
);

const syncUrl = new URL('../services/sync-service.ts', storeUrl);

export function resolve(specifier, context, nextResolve) {
	if (
		(context.parentURL === storeUrl.href &&
			specifier.startsWith('../services/')) ||
		(context.parentURL === syncUrl.href && specifier === '../lib/random-id')
	) {
		return nextResolve(`${specifier}.ts`, context);
	}
	return nextResolve(specifier, context);
}
