'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	advanceReadingWords,
	measureReadingStops,
	readingTop,
	type ReadingStop,
	wordsAtTop,
} from '../lib/teleprompter';

export function useTeleprompter({
	slug,
	ready,
	wordsPerMinute,
}: {
	slug: string | undefined;
	ready: boolean;
	wordsPerMinute: number;
}) {
	const scroll = useRef<HTMLElement>(null);
	const script = useRef<HTMLDivElement>(null);
	const stops = useRef<ReadingStop[]>([]);
	const spokenWords = useRef(0);
	const manuallyScrolled = useRef(false);
	const [overflowing, setOverflowing] = useState(false);
	const [atEnd, setAtEnd] = useState(false);
	const [manualPlay, setManualPlay] = useState<boolean | null>(null);
	const [reducedMotion, setReducedMotion] = useState(true);
	const [visible, setVisible] = useState(true);
	const playing =
		ready && overflowing && !atEnd && visible && (manualPlay ?? !reducedMotion);
	const playingNow = useRef(playing);

	const pauseForInteraction = useCallback(() => {
		playingNow.current = false;
		manuallyScrolled.current = true;
		setManualPlay(false);
		setAtEnd(false);
	}, []);

	useEffect(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updatePreference = () => setReducedMotion(preference.matches);
		const updateVisibility = () => {
			setVisible(!document.hidden);
			if (document.hidden) pauseForInteraction();
		};
		updatePreference();
		updateVisibility();
		preference.addEventListener('change', updatePreference);
		document.addEventListener('visibilitychange', updateVisibility);
		return () => {
			preference.removeEventListener('change', updatePreference);
			document.removeEventListener('visibilitychange', updateVisibility);
		};
	}, [pauseForInteraction]);

	useEffect(() => {
		const element = scroll.current;
		const content = script.current;
		if (!ready || !slug || !element || !content) return;
		element.scrollTop = 0;
		spokenWords.current = 0;
		manuallyScrolled.current = false;
		setManualPlay(null);
		setAtEnd(false);
		const measure = () => {
			stops.current = measureReadingStops(content, element);
			const maximum = element.scrollHeight - element.clientHeight;
			setOverflowing(maximum > 2 && stops.current.length > 1);
			setAtEnd(maximum > 2 && element.scrollTop >= maximum - 1);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		observer.observe(content);
		return () => observer.disconnect();
	}, [ready, slug]);

	useEffect(() => {
		playingNow.current = playing;
		const element = scroll.current;
		if (!playing || !element) return;
		if (manuallyScrolled.current) {
			spokenWords.current =
				element.scrollTop <= 1
					? 0
					: wordsAtTop(
							stops.current,
							element.scrollTop + element.clientHeight * 0.3
						);
			manuallyScrolled.current = false;
		}
		let frame = 0;
		let lastTime: number | null = null;
		const tick = (now: number) => {
			if (!playingNow.current) return;
			spokenWords.current = advanceReadingWords(
				spokenWords.current,
				lastTime,
				now,
				wordsPerMinute
			);
			lastTime = now;
			const maximum = element.scrollHeight - element.clientHeight;
			const readingLine = element.clientHeight * 0.3;
			element.scrollTop = Math.min(
				maximum,
				Math.max(
					0,
					readingTop(stops.current, spokenWords.current) - readingLine
				)
			);
			if (element.scrollTop >= maximum - 1) {
				setAtEnd(true);
				return;
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [playing, wordsPerMinute, slug]);

	const toggle = () => {
		const element = scroll.current;
		if (!element) return;
		if (playing) {
			playingNow.current = false;
			setManualPlay(false);
			return;
		}
		if (element.scrollTop >= element.scrollHeight - element.clientHeight - 1) {
			element.scrollTop = 0;
			spokenWords.current = 0;
		}
		setAtEnd(false);
		setManualPlay(true);
	};

	return {
		scroll,
		script,
		overflowing,
		playing,
		atEnd,
		paused: manualPlay === false,
		toggle,
		pauseForInteraction,
	};
}
