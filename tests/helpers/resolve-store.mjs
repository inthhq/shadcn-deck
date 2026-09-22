const storeUrl = new URL(
	'../../src/pkgs/deck/core/store/presentation-store.ts',
	import.meta.url
);

export function resolve(specifier, context, nextResolve) {
	if (
		context.parentURL === storeUrl.href &&
		specifier.startsWith('../services/')
	) {
		return nextResolve(`${specifier}.ts`, context);
	}
	return nextResolve(specifier, context);
}
