import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

interface SlideProps {
	children: ReactNode;
	className?: string;
	backgroundImage?: string;
	backgroundColor?: string;
	gradient?: 'down' | 'up';
	contentPosition?: 'center' | 'top' | 'bottom';
	padding?: 'none' | 'small' | 'medium' | 'large';
	variant?: 'default' | 'border';
}

/**
 * Slide component - Container for slide content
 *
 * Provides layout and styling for individual presentation slides
 */
export function Slide({
	children,
	className,
	backgroundImage,
	backgroundColor,
	gradient,
	contentPosition = 'center',
	padding = 'medium',
	variant = 'border',
}: SlideProps) {
	// Content position classes
	const positionClasses = {
		center: 'justify-center',
		top: 'justify-start pt-16',
		bottom: 'justify-end pb-16',
	};

	// Padding classes
	const paddingClasses = {
		none: 'p-0',
		small: 'p-4',
		medium: 'p-8',
		large: 'px-16 py-24',
	};

	// Variant classes
	const variantClasses = {
		default: 'bg-card text-foreground',
		border: 'bg-card text-foreground',
	};

	// Background style
	const getBackgroundImage = () => {
		if (backgroundImage) {
			return `url(${backgroundImage})`;
		}

		return undefined;
	};


	const backgroundStyle = {
		backgroundImage: getBackgroundImage(),
		backgroundColor: backgroundColor || undefined,
	};

	return (
		<div
			className={cn(
				'relative z-0 flex h-full w-full flex-col overflow-hidden bg-center bg-cover',
				variantClasses[variant],
				positionClasses[contentPosition],
				paddingClasses[padding],
				className
			)}
			style={backgroundStyle}
			data-slide-content="true"
			data-print-background-image={backgroundImage || undefined}
		>
			{variant === 'border' && (
				<>
					<div
						className={cn(
							'absolute inset-0 -z-10 m-8 rounded-b-3xl border-gray-200',
						)}
					/>
					<div className="absolute inset-0 -z-20 mx-auto px-8">
						<div
							className={cn(
								'absolute inset-8 mx-px border-base-300 border-t bg-card px-8',
								!gradient && 'border-b'
							)}
						/>
						<div className="mx-auto grid h-full grid-cols-4 gap-0 divide-x divide-base-300 border-base-300 border-x dark:divide-base-900">
						</div>
					</div>
				</>
			)}
			{children}
		</div>
	);
}

export function SlideTitle({
	title,
	className,
}: {
	title: string;
	className?: string;
}) {
	return (
		<h1 className={cn('mb-6 font-bold text-4xl tracking-tight', className)}>
			{title}
		</h1>
	);
}
