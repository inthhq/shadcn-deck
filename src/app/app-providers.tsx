'use client';

import { LazyMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { PresentationProvider } from '~/pkgs/deck';
import { slideDefinitions } from '~/presentation/router';

const loadMotionFeatures = () =>
	import('~/components/ui/motion-features').then((module) => module.default);

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<LazyMotion features={loadMotionFeatures}>
			<PresentationProvider slides={slideDefinitions}>
				{children}
			</PresentationProvider>
		</LazyMotion>
	);
}
