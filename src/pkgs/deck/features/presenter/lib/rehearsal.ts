import type { SlideDefinition } from '../../../core/types/types';

export interface PlannedSlide {
	slug: string;
	title: string;
	duration: number;
	appendix: boolean;
}

export interface RehearsalRun {
	id: string;
	startedAt: number;
	finishedAt: number | null;
	elapsedMs: number;
	runningSince: number | null;
	activeSlug: string;
	startSlug: string;
	timings: Record<string, number>;
	plan: PlannedSlide[];
}

export function isAppendix(slide: SlideDefinition) {
	return slide.metadata?.tags?.includes('Appendix') ?? false;
}

export function snapshotPlan(slides: SlideDefinition[]): PlannedSlide[] {
	return slides.map((slide) => ({
		slug: slide.slug,
		title: slide.title,
		duration: slide.metadata?.duration ?? 0,
		appendix: isAppendix(slide),
	}));
}

// A partial rehearsal is planned from its starting slide to the end of the
// main deck. Missing targets cannot be treated as zero-second allowances.
export function getPlannedDuration(
	plan: PlannedSlide[],
	startSlug = plan[0]?.slug
): number | null {
	const start = plan.findIndex((slide) => slide.slug === startSlug);
	if (start < 0 || plan[start].appendix) return null;
	const main = plan.slice(start).filter((slide) => !slide.appendix);
	if (
		main.some(
			(slide) => !Number.isFinite(slide.duration) || slide.duration <= 0
		)
	)
		return null;
	return main.reduce((total, slide) => total + slide.duration, 0);
}

// Accumulate wall-clock deltas, so background-tab throttling cannot slow the timer.
export function checkpoint(run: RehearsalRun, now: number): RehearsalRun {
	if (run.runningSince === null) return run;
	const delta = Math.max(0, now - run.runningSince);
	return {
		...run,
		elapsedMs: run.elapsedMs + delta,
		runningSince: now,
		timings: {
			...run.timings,
			[run.activeSlug]: (run.timings[run.activeSlug] ?? 0) + delta,
		},
	};
}

export function visitSlide(run: RehearsalRun, slug: string, now: number) {
	return { ...checkpoint(run, now), activeSlug: slug };
}

export function formatDuration(seconds: number) {
	const value = Math.max(0, Math.floor(Math.abs(seconds)));
	return `${Math.floor(value / 60)
		.toString()
		.padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

export function getPacing(run: RehearsalRun | null, slug: string) {
	if (!run || getPlannedDuration(run.plan, run.startSlug) === null) return null;
	const start = run.plan.findIndex((slide) => slide.slug === run.startSlug);
	const index = run.plan.findIndex((slide) => slide.slug === slug);
	const slide = run.plan[index];
	if (!slide || slide.appendix || index < start || start < 0) return null;
	const completed = run.plan
		.slice(start, index)
		.filter((item) => !item.appendix);
	const plannedBefore = completed.reduce(
		(total, item) => total + item.duration,
		0
	);
	const actualBefore = completed.reduce(
		(total, item) => total + (run.timings[item.slug] ?? 0) / 1000,
		0
	);
	const slideSeconds = (run.timings[slug] ?? 0) / 1000;
	// Keep the completed-slide variance stable while within this slide's allowance.
	// Once this slide exceeds its target, the extra time counts as delay too.
	return (
		actualBefore - plannedBefore + Math.max(0, slideSeconds - slide.duration)
	);
}
