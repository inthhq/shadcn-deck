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

export function ViewTransitionsProvider({ children }: { children: ReactNode }) {
	// Check if the browser supports View Transitions API
	const supportsViewTransitions =
		typeof document !== 'undefined' && 'startViewTransition' in document;

	const startViewTransition = (callback: () => void) => {
		if (supportsViewTransitions) {
			document.startViewTransition(callback);
		} else {
			// Fallback for browsers that don't support View Transitions
			callback();
		}
	};

	return (
		<ViewTransitionsContext.Provider value={{ startViewTransition }}>
			{children}
		</ViewTransitionsContext.Provider>
	);
}
