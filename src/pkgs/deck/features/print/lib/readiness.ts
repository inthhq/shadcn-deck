export interface PrintReadiness {
	ready: boolean;
	failedImages: number;
}

/** Follow media added after hydration as well as assets present on first paint. */
export function observePrintReadiness(
	root: HTMLElement,
	onChange: (state: PrintReadiness) => void
) {
	const document = root.ownerDocument;
	let generation = 0;
	let disposed = false;
	const check = async () => {
		const current = ++generation;
		onChange({ ready: false, failedImages: 0 });
		if (root.querySelector('[aria-busy="true"]')) return;

		const images = Array.from(root.querySelectorAll('img'));
		// Slide backgrounds are CSS images, so expose their original URLs explicitly.
		for (const slide of root.querySelectorAll(
			'[data-print-background-image]'
		)) {
			const source = slide.getAttribute('data-print-background-image');
			if (!source) continue;
			const image = document.createElement('img');
			image.src = source;
			images.push(image);
		}
		// Offscreen slides must load too, before the print dialog is opened.
		for (const image of images) image.loading = 'eager';
		const results = await Promise.allSettled(
			images.map((image) => image.decode())
		);
		await document.fonts.ready;
		if (disposed || current !== generation) return;
		onChange({
			ready: true,
			failedImages: results.filter((result) => result.status === 'rejected')
				.length,
		});
	};
	const observer = new MutationObserver(() => void check());
	observer.observe(root, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: [
			'src',
			'srcset',
			'sizes',
			'aria-busy',
			'data-print-background-image',
		],
	});
	document.fonts.addEventListener('loading', check);
	void check();
	return () => {
		disposed = true;
		generation++;
		observer.disconnect();
		document.fonts.removeEventListener('loading', check);
	};
}
