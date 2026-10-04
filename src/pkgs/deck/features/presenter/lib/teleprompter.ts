export interface ReadingStop {
	word: number;
	top: number;
}

/** Keep the speaking clock independent of how often the browser paints. */
export function advanceReadingWords(
	words: number,
	previousTime: number | null,
	now: number,
	wordsPerMinute: number
) {
	const elapsed = previousTime === null ? 0 : Math.max(0, now - previousTime);
	return words + (elapsed * wordsPerMinute) / 60_000;
}

/** Map spoken words to rendered lines, including the space between paragraphs. */
export function readingTop(stops: ReadingStop[], words: number): number {
	if (!stops.length) return 0;
	for (let index = 1; index < stops.length; index++) {
		const next = stops[index];
		const previous = stops[index - 1];
		if (words <= next.word) {
			const progress = Math.max(
				0,
				(words - previous.word) / (next.word - previous.word)
			);
			return previous.top + (next.top - previous.top) * progress;
		}
	}
	return stops[stops.length - 1].top;
}

/** Resume near the reading line after the speaker has scrolled manually. */
export function wordsAtTop(stops: ReadingStop[], top: number): number {
	if (!stops.length) return 0;
	for (let index = 1; index < stops.length; index++) {
		const next = stops[index];
		const previous = stops[index - 1];
		if (top <= next.top) {
			const progress = Math.max(
				0,
				(top - previous.top) / (next.top - previous.top)
			);
			return previous.word + (next.word - previous.word) * progress;
		}
	}
	return stops[stops.length - 1].word;
}

export function measureReadingStops(
	script: HTMLElement,
	scroller: HTMLElement
): ReadingStop[] {
	const stops: ReadingStop[] = [];
	const origin = scroller.getBoundingClientRect().top - scroller.scrollTop;
	const walker = document.createTreeWalker(script, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	let words = 0;
	let node = walker.nextNode();
	while (node) {
		for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
			range.setStart(node, match.index);
			range.setEnd(node, match.index + match[0].length);
			const rect = range.getClientRects()[0];
			if (!rect?.height) continue;
			const top = rect.top - origin;
			if (!stops.length || top > stops[stops.length - 1].top + 2)
				stops.push({ word: words, top });
			words++;
		}
		node = walker.nextNode();
	}
	if (stops.length) {
		const lineHeight = Number.parseFloat(getComputedStyle(script).lineHeight);
		stops.push({
			word: words,
			top: stops[stops.length - 1].top + (lineHeight || 40),
		});
	}
	return stops;
}
