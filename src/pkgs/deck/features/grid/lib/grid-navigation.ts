export function getGridSlideHref(
	slug: string,
	pathname: string,
	queryRef: string | null = null
): string {
	// The path is authoritative; query refs support older grid entry points.
	const pathPrefix = pathname.match(/^\/ref\/[^/]+(?=\/|$)/)?.[0];
	const prefix =
		pathPrefix ?? (queryRef ? `/ref/${encodeURIComponent(queryRef)}` : '');

	return `${prefix}/${encodeURIComponent(slug)}`;
}
