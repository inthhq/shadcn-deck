import { cva } from 'class-variance-authority';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '~/lib/utils';

// Define box variants using tailwind-variants
const boxStyles = cva('flex flex-1 flex-col bg-card text-foreground', {
	variants: {
		padding: {
			none: 'p-0',
			sm: 'p-2',
			md: 'p-4',
			lg: 'p-8',
		},
		border: {
			true: 'border border-border',
		},
		rounded: {
			sm: 'rounded-sm',
			md: 'rounded-md',
			lg: 'rounded-lg',
			none: '',
		},
		shadow: {
			sm: 'shadow-sm',
			md: 'shadow-md',
			lg: 'shadow-lg',
			none: '',
		},
		animate: {
			true: 'animate-fade-in',
		},
	},
	defaultVariants: {
		padding: 'lg',
		border: false,
		rounded: 'lg',
		shadow: 'none',
		animate: false,
	},
});

export interface BoxProps {
	children: ReactNode;
	className?: string;
	padding?: 'none' | 'sm' | 'md' | 'lg';
	backgroundColor?: string;
	border?: boolean;
	rounded?: boolean | 'sm' | 'md' | 'lg';
	shadow?: boolean | 'sm' | 'md' | 'lg';
	width?: string;
	height?: string;
	animate?: boolean;
}

/**
 * Box component - Flexible container with various styling options
 * Optimized as a Server Component
 */
export function Box({
	children,
	className,
	padding,
	backgroundColor,
	border,
	rounded,
	shadow,
	width,
	height,
	animate,
}: BoxProps) {
	// Handle boolean values for rounded
	let roundedValue: 'sm' | 'md' | 'lg' | 'none' = 'none';
	if (rounded === true) {
		roundedValue = 'md';
	} else if (rounded) {
		roundedValue = rounded;
	}

	// Handle boolean values for shadow
	let shadowValue: 'sm' | 'md' | 'lg' | 'none' = 'none';
	if (shadow === true) {
		shadowValue = 'md';
	} else if (shadow) {
		shadowValue = shadow;
	}

	// Background style
	const style: CSSProperties = {};
	if (backgroundColor) {
		style.backgroundColor = backgroundColor;
	}
	if (width) {
		style.width = width;
	}
	if (height) {
		style.height = height;
	}

	return (
		<div
			className={cn(
				boxStyles({
					padding,
					border,
					rounded: roundedValue,
					shadow: shadowValue,
					animate,
				}),
				className
			)}
			style={style}
		>
			{children}
		</div>
	);
}
