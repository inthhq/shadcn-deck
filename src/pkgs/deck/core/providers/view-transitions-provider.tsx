'use client';

import { type ReactNode, createContext, useContext } from 'react';

interface ViewTransitionsContextType {
	startViewTransition: (callback: () => void) => void;
}

const ViewTransitionsContext = createContext<ViewTransitionsContextType | null>(
	null
);

export function useViewTransitions() {
	const context = useContext(ViewTransitionsContext);
	if (!context) {
		throw new Error(
			'useViewTransitions must be used within a ViewTransitionsProvider'
		);
	}
	return context;
}

// Rapid navigation starts a new transition while the previous one is still
// running. The View Transition API skips the older one with an AbortError on
// `ready`, and may still run its update callback afterwards. Two safeguards:
// only the latest request's callback navigates, and the expected AbortError
// rejection is swallowed so it does not surface as a runtime error. Any other
// failure is still reported.
let activeTransition: ViewTransition | null = null;
let latestRequest = 0;

const isAbort = (error: unknown) =>
	error instanceof DOMException && error.name === 'AbortError';

const transitionContext: ViewTransitionsContextType = {
	startViewTransition(callback) {
		const request = ++latestRequest;
		if (
			typeof document === 'undefined' ||
			!('startViewTransition' in document)
		) {
			callback();
			return;
		}
		activeTransition?.skipTransition();
		const transition = document.startViewTransition(() => {
			if (request === latestRequest) callback();
		});
		activeTransition = transition;
		const settle = () => {
			if (activeTransition === transition) activeTransition = null;
		};
		transition.ready.catch((error) => {
			if (!isAbort(error)) {
				console.error('View transition failed before it was ready:', error);
			}
		});
		transition.updateCallbackDone.catch((error) => {
			console.error('View transition update callback failed:', error);
		});
		transition.finished.then(settle, settle);
	},
};

export function ViewTransitionsProvider({ children }: { children: ReactNode }) {
	return (
		<ViewTransitionsContext.Provider value={transitionContext}>
			{children}
		</ViewTransitionsContext.Provider>
	);
}
