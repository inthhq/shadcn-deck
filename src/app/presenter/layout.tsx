'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Suspense, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { usePresentationStore } from '~/pkgs/deck/core/store/presentation-store';

// Skeleton components for loading states
function ControlsSkeleton() {
	return (
		<div className="flex h-16 items-center justify-between border-border border-b bg-card px-6">
			<div className="flex items-center gap-3">
				<div className="h-8 w-32 animate-pulse rounded bg-muted" />
				<div className="h-8 w-20 animate-pulse rounded bg-muted" />
			</div>
			<div className="flex items-center gap-2">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
				<div className="size-8 animate-pulse rounded-full bg-muted" />
				<div className="h-8 w-24 animate-pulse rounded bg-muted" />
			</div>
		</div>
	);
}

function SlideNavSkeleton() {
	return (
		<div className="flex flex-grow flex-col space-y-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
					<div className="h-4 w-20 animate-pulse rounded bg-muted" />
				</div>
				<div className="flex items-center gap-2">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
					<div className="size-8 animate-pulse rounded-full bg-muted" />
					<div className="size-8 animate-pulse rounded-full bg-muted" />
					<div className="h-8 w-20 animate-pulse rounded bg-muted" />
				</div>
			</div>
			<div className="h-1 w-full animate-pulse rounded-full bg-muted" />
		</div>
	);
}

function CurrentSlideSkeleton() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="h-64 w-full animate-pulse rounded bg-muted" />
		</div>
	);
}

function NotesSkeleton() {
	return (
		<Card className="flex-grow overflow-hidden">
			<CardHeader>
				<CardTitle className="flex items-center gap-1.5 text-sm">
					<div className="h-4 w-4 animate-pulse rounded bg-muted" />
					<div className="h-4 w-24 animate-pulse rounded bg-muted" />
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-20 animate-pulse rounded-md bg-muted" />
			</CardContent>
		</Card>
	);
}

function NextSlideSkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center text-sm">
					<div className="mr-2 h-4 w-8 animate-pulse rounded-full bg-muted" />
					<div className="h-4 w-16 animate-pulse rounded bg-muted" />
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="aspect-video w-full animate-pulse rounded bg-muted" />
			</CardContent>
		</Card>
	);
}

function UpcomingSlidesSkeleton() {
	return (
		<Card className="flex-1 overflow-y-auto">
			<CardHeader>
				<CardTitle className="flex items-center text-sm">
					<div className="mr-2 h-4 w-16 animate-pulse rounded-full bg-muted" />
					<div className="h-4 w-12 animate-pulse rounded bg-muted" />
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-2">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="aspect-video animate-pulse rounded bg-muted"
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

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
	// Initialize presenter mode
	const { setPresenterMode, initServices, setRouter, cleanup } =
		usePresentationStore();
	const router = useRouter();

	// Set presenter mode on component mount
	useEffect(() => {
		// Mark this as presenter view
		setPresenterMode(true);
		setRouter(router);

		// Initialize services
		initServices();

		// Add a message to the window title to identify presenter view
		if (typeof window !== 'undefined') {
			const oldTitle = document.title;
			document.title = `${oldTitle} (Presenter)`;

			// Cleanup on unmount
			return () => {
				document.title = oldTitle;
				setPresenterMode(false);
				cleanup();
			};
		}
	}, [setPresenterMode, initServices, router, setRouter, cleanup]);

	return (
		<div className="fixed inset-0 flex flex-col overflow-hidden bg-muted text-foreground">
			{children}
			{/* Slot for Header Controls */}
			<Suspense fallback={<ControlsSkeleton />}>{controls}</Suspense>

			{/* Main Content Area Grid */}
			<div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden p-6 md:grid-cols-3">
				{/* Left Column (Current Slide + Notes) */}
				<div className="flex flex-col space-y-6 overflow-hidden md:col-span-2">
					{/* Slot for Slide Navigation (Prev/Next) */}
					<div className="flex flex-col space-y-4">
						<Suspense fallback={<SlideNavSkeleton />}>{slideNav}</Suspense>
					</div>

					{/* Current Slide Preview Card */}
					<Card className="overflow-hidden">
						<CardContent className="w-full bg-gradient-to-b from-muted/10 to-muted/5 p-2">
							<Suspense fallback={<CurrentSlideSkeleton />}>
								{currentSlide}
							</Suspense>
						</CardContent>
					</Card>

					{/* Speaker Notes Card */}
					<Suspense fallback={<NotesSkeleton />}>{notes}</Suspense>
				</div>

				{/* Right Column (Next + Upcoming) */}
				<div className="flex flex-col space-y-6 md:col-span-1">
					{/* Slot for Next Slide Preview */}
					<Suspense fallback={<NextSlideSkeleton />}>{nextSlide}</Suspense>
					{/* Slot for Upcoming Slides Grid */}
					<Suspense fallback={<UpcomingSlidesSkeleton />}>
						{upcomingSlides}
					</Suspense>
				</div>
			</div>
		</div>
	);
}
