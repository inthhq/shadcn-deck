'use client';

import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useFullscreen } from '../hooks/use-fullscreen';
import { usePresentationStore } from '../store/presentation-store';
import type { SlideDefinition } from '../types/types';
import { useViewTransitions } from './view-transitions-provider';

export function DeckProvider({
	children,
	slides,
}: {
	children: ReactNode;
	slides: SlideDefinition[];
}) {
	const router = useRouter();
	const { startViewTransition } = useViewTransitions();

	const {
		setSlides,
		initServices,
		goToNextSlide,
		goToPreviousSlide,
		cleanup,
		setFullscreen,
		isFullyReady,
		setRouter,
	} = usePresentationStore();

	const fullscreenRef = useRef<HTMLElement>(null);
	const { toggleFullscreen } = useFullscreen(fullscreenRef, {
		onEnter: () => setFullscreen(true),
		onExit: () => setFullscreen(false),
	});

	const { setTheme, theme } = useTheme();
	const toggleTheme = useCallback(() => {
		setTheme(theme === 'dark' ? 'light' : 'dark');
	}, [setTheme, theme]);

	useEffect(() => {
		if (typeof document !== 'undefined') {
			fullscreenRef.current = document.documentElement;
		}
	}, []);

	useEffect(() => {
		setRouter(router);
	}, [router, setRouter]);

	useEffect(() => {
		const initializeEverything = async () => {
			try {
				setSlides(slides);
				await new Promise((resolve) => setTimeout(resolve, 50));
				initServices();
			} catch (error) {
				console.error('DeckProvider: Initialization failed:', error);
			}
		};

		initializeEverything();

		return () => {
			cleanup();
		};
	}, [setSlides, initServices, cleanup, slides]);

	useEffect(() => {
		const handleUrlChange = (e: Event) => {
			const customEvent = e as CustomEvent<{ path: string }>;
			const path = customEvent.detail.path;
			if (path) {
				// Preserve /ref/:ref prefix when present (detect from pathname, not query)
				const match = window.location.pathname.match(/^\/(ref\/[^/]+)/);
				const prefix = match ? `/${match[1]}` : '';
				const target = `${prefix}${path}`;
				startViewTransition(() => {
					router.push(target);
				});
			}
		};

		window.addEventListener('urlchange', handleUrlChange);
		return () => {
			window.removeEventListener('urlchange', handleUrlChange);
		};
	}, [router, startViewTransition]);

	useEffect(() => {
		if (!isFullyReady) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Print preview uses native scrolling and button keyboard activation.
			if (window.location.pathname.replace(/^\/ref\/[^/]+/, '') === '/print') {
				return;
			}
			if (e.ctrlKey || e.altKey || e.metaKey) {
				return;
			}

			const target = e.target as HTMLElement;
			if (
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.contentEditable === 'true'
			) {
				return;
			}

			switch (e.key) {
				case 'ArrowRight':
				case ' ':
					e.preventDefault();
					goToNextSlide();
					break;
				case 'ArrowLeft':
					e.preventDefault();
					goToPreviousSlide();
					break;
				case 'f':
				case 'F':
					e.preventDefault();
					toggleFullscreen();
					break;
				case 't':
				case 'T':
					e.preventDefault();
					toggleTheme();
					break;
				default:
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [
		goToNextSlide,
		goToPreviousSlide,
		toggleFullscreen,
		toggleTheme,
		isFullyReady,
	]);

	return <>{children}</>;
}
