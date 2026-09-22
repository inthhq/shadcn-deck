'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, Suspense, useEffect } from 'react';
import { usePresentationStore } from '~/pkgs/deck/core/store/presentation-store';
import { NotesWorkspace } from '~/pkgs/deck/features/presenter/components/notes-workspace';
import { PresenterSession } from '~/pkgs/deck/features/presenter/components/presenter-session';
import './presenter.css';

export default function PresenterLayout({
	children,
	controls,
	currentSlide,
	slideNav,
	notes,
	nextSlide,
	upcomingSlides,
}: {
	children: ReactNode;
	controls: ReactNode;
	currentSlide: ReactNode;
	slideNav: ReactNode;
	notes: ReactNode;
	nextSlide: ReactNode;
	upcomingSlides: ReactNode;
}) {
	const setPresenterMode = usePresentationStore(
		(state) => state.setPresenterMode
	);
	const setRouter = usePresentationStore((state) => state.setRouter);
	const router = useRouter();
	useEffect(() => {
		setPresenterMode(true);
		setRouter(router);
		const oldTitle = document.title;
		document.title = `${oldTitle} (Presenter)`;
		return () => {
			document.title = oldTitle;
			setPresenterMode(false);
		};
	}, [setPresenterMode, setRouter, router]);
	return (
		<main className="presenter-shell">
			<PresenterSession />
			{children}

			<header className="presenter-toolbar">
				<Suspense>{slideNav}</Suspense>
				<Suspense>{controls}</Suspense>
			</header>
			<div className="presenter-body">
				<NotesWorkspace
					notes={
						<Suspense
							fallback={<div className="presenter-loading">Loading notes…</div>}
						>
							{notes}
						</Suspense>
					}
					currentSlide={<Suspense>{currentSlide}</Suspense>}
					nextSlide={<Suspense>{nextSlide}</Suspense>}
				/>
				<Suspense>{upcomingSlides}</Suspense>
			</div>
		</main>
	);
}
