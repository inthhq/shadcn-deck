'use client';

import type { ReactNode } from 'react';
import useMeasure from 'react-use-measure';

import { cn } from '~/lib/utils';

interface AspectRatioScalerProps {
	children: ReactNode;
	designWidth: number;
	designHeight: number;
	className?: string;
	disablePointerEvents?: boolean;
	centerContent?: boolean;
	allowOverflow?: boolean;
	fullWidthAutoHeight?: boolean;
}

export function AspectRatioScaler({
	children,
	designWidth,
	designHeight,
	className,
	disablePointerEvents,
	centerContent = false,
	allowOverflow = false,
	fullWidthAutoHeight = false,
}: AspectRatioScalerProps) {
	const [ref, bounds] = useMeasure();
	const hasMeasured =
		bounds.width > 0 && (fullWidthAutoHeight || bounds.height > 0);
	const scaleWidth = bounds.width / designWidth;
	const scaleHeight = bounds.height / designHeight;
	const scale = fullWidthAutoHeight
		? scaleWidth
		: Math.min(scaleWidth, scaleHeight);

	// Calculate positioning for centering
	const scaledWidth = designWidth * scale;
	const scaledHeight = designHeight * scale;
	const containerWidth = bounds.width || 0;
	const containerHeight = bounds.height || 0;

	const offsetX = centerContent ? (containerWidth - scaledWidth) / 2 : 0;
	const offsetY = centerContent ? (containerHeight - scaledHeight) / 2 : 0;

	return (
		<div
			ref={ref}
			className={cn(
				'relative w-full',
				// For full width auto height, don't constrain height
				fullWidthAutoHeight ? 'h-auto' : 'h-full',
				allowOverflow ? 'overflow-visible' : 'overflow-hidden',
				className
			)}
			// When using fullWidthAutoHeight, set the container height based on aspect ratio
			style={
				fullWidthAutoHeight
					? { aspectRatio: `${designWidth} / ${designHeight}` }
					: undefined
			}
		>
			{hasMeasured && (
				<div
					className={cn('absolute', {
						'pointer-events-none': disablePointerEvents,
					})}
					style={{
						width: designWidth,
						height: designHeight,
						transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
						transformOrigin: 'top left',
					}}
				>
					{children}
				</div>
			)}
		</div>
	);
}
