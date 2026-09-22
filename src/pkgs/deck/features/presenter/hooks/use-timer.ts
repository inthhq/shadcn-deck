'use client';

import { usePresentationStore } from '../../../core/store/presentation-store';
import {
	formatDuration,
	getPacing,
	getPlannedDuration,
	snapshotPlan,
} from '../lib/rehearsal';
import { usePresenterStore } from '../state/presenter-store';

export function useTimer() {
	const run = usePresenterStore((state) => state.run);
	const slug = usePresentationStore((state) => state.slug);
	const slides = usePresentationStore((state) => state.slides);
	const seconds = (run?.elapsedMs ?? 0) / 1000;
	const plannedSeconds = getPlannedDuration(
		run?.plan ?? snapshotPlan(slides),
		run?.startSlug ?? slug
	);
	return {
		run,
		isRunning: run?.runningSince != null,
		seconds,
		plannedSeconds,
		remaining: plannedSeconds === null ? null : plannedSeconds - seconds,
		formattedTime: formatDuration(seconds),
		pace: getPacing(run, slug),
		slideSeconds: (run?.timings[slug] ?? 0) / 1000,
	};
}
