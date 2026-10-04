type ProgressAnimationOptions = {
	from: number;
	to: number;
	duration: number;
	onUpdate: (value: number) => void;
};

/** Animate a value, returning cleanup for whichever frame is currently queued. */
export function animateProgress({
	from,
	to,
	duration,
	onUpdate,
}: ProgressAnimationOptions) {
	if (from === to) return;
	if (duration <= 0 || Math.abs(to - from) < 0.01) {
		onUpdate(to);
		return;
	}

	const startTime = performance.now();
	let frameId = 0;
	let cancelled = false;
	const tick = (timestamp: number) => {
		if (cancelled) return;
		const progress = Math.min((timestamp - startTime) / duration, 1);
		const eased = 1 - (1 - progress) * (1 - progress);
		onUpdate(from + (to - from) * eased);
		if (progress < 1) frameId = requestAnimationFrame(tick);
	};
	frameId = requestAnimationFrame(tick);
	return () => {
		cancelled = true;
		cancelAnimationFrame(frameId);
	};
}
