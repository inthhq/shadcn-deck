'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SlideDefinition } from '../../../core/types/types';
import {
	checkpoint,
	type RehearsalRun,
	snapshotPlan,
	visitSlide,
} from '../lib/rehearsal';

interface PresenterState {
	fontSize: number;
	notesWidth: number;
	notesExpanded: boolean;
	wordsPerMinute: number;
	run: RehearsalRun | null;
	history: RehearsalRun[];
	recovered: boolean;
	storageError: boolean;
	setFontSize: (value: number) => void;
	setNotesWidth: (value: number) => void;
	toggleNotes: () => void;
	setWordsPerMinute: (value: number) => void;
	start: (slug: string, slides: SlideDefinition[]) => void;
	pause: () => void;
	tick: () => void;
	visit: (slug: string) => void;
	finish: () => void;
	reset: () => void;
}

const storage = createJSONStorage(() => ({
	getItem: (name: string) => {
		try {
			return localStorage.getItem(name);
		} catch {
			queueMicrotask(() => {
				if (!usePresenterStore.getState().storageError)
					usePresenterStore.setState({ storageError: true });
			});
			return null;
		}
	},
	setItem: (name: string, value: string) => {
		try {
			localStorage.setItem(name, value);
		} catch {
			queueMicrotask(() => {
				if (!usePresenterStore.getState().storageError)
					usePresenterStore.setState({ storageError: true });
			});
		}
	},
	removeItem: (name: string) => {
		try {
			localStorage.removeItem(name);
		} catch {
			/* no destructive fallback */
		}
	},
}));

export const usePresenterStore = create<PresenterState>()(
	persist(
		(set, get) => ({
			fontSize: 24,
			notesWidth: 58,
			notesExpanded: false,
			wordsPerMinute: 130,
			run: null,
			history: [],
			recovered: false,
			storageError: false,
			setFontSize: (value) =>
				set({ fontSize: Math.max(18, Math.min(40, value)) }),
			setNotesWidth: (value) =>
				set({ notesWidth: Math.max(35, Math.min(75, value)) }),
			toggleNotes: () => set({ notesExpanded: !get().notesExpanded }),
			setWordsPerMinute: (value) => {
				if (Number.isFinite(value))
					set({ wordsPerMinute: Math.max(80, Math.min(220, value)) });
			},
			start: (slug, slides) => {
				const now = Date.now();
				const run = get().run;
				if (run?.runningSince != null) return;
				set({
					recovered: false,
					run: run
						? { ...run, activeSlug: slug, runningSince: now }
						: {
								id: crypto.randomUUID(),
								startedAt: now,
								finishedAt: null,
								elapsedMs: 0,
								runningSince: now,
								activeSlug: slug,
								startSlug: slug,
								timings: {},
								plan: snapshotPlan(slides),
							},
				});
			},
			pause: () => {
				const run = get().run;
				if (run)
					set({ run: { ...checkpoint(run, Date.now()), runningSince: null } });
			},
			tick: () => {
				const run = get().run;
				if (run?.runningSince != null)
					set({ run: checkpoint(run, Date.now()) });
			},
			visit: (slug) => {
				const run = get().run;
				if (run && run.activeSlug !== slug)
					set({ run: visitSlide(run, slug, Date.now()) });
			},
			finish: () => {
				const run = get().run;
				if (!run) return;
				const now = Date.now();
				set({
					history: [
						{ ...checkpoint(run, now), runningSince: null, finishedAt: now },
						...get().history,
					].slice(0, 10),
					run: null,
					recovered: false,
				});
			},
			reset: () => set({ run: null, recovered: false }),
		}),
		{
			name: 'shadcn-deck-presenter-v1',
			storage,
			skipHydration: true,
			partialize: ({ fontSize, notesWidth, wordsPerMinute, run, history }) => ({
				fontSize,
				notesWidth,
				wordsPerMinute,
				run,
				history,
			}),
			merge: (persisted, current) => {
				const saved = persisted as Partial<PresenterState> | undefined;
				if (!saved) return current;
				// A refreshed/reopened console resumes paused at its last saved checkpoint.
				// Time spent away from the console must not inflate a rehearsal.
				return {
					...current,
					fontSize: Math.max(18, Math.min(40, saved.fontSize ?? 24)),
					notesWidth: Math.max(35, Math.min(75, saved.notesWidth ?? 58)),
					wordsPerMinute: Number.isFinite(saved.wordsPerMinute)
						? Math.max(80, Math.min(220, saved.wordsPerMinute ?? 130))
						: 130,
					run: saved.run ? { ...saved.run, runningSince: null } : null,
					history: saved.history ?? [],
					recovered: !!saved.run,
				};
			},
		}
	)
);
