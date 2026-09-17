import { cva } from 'class-variance-authority';
import { ArrowRight, Check, Circle } from 'lucide-react';
import { Children, type ReactNode, isValidElement } from 'react';
import { cn } from '~/lib/utils';

// Define list variants using tailwind-variants with slots
const listStyles = cva('pl-2', {
	variants: {
		type: {
			ordered: {},
			unordered: {},
			checked: {},
			arrow: {},
		},
		size: {
			sm: { base: 'text-sm' },
			md: { base: 'text-base' },
			lg: { base: 'text-lg' },
		},
		spacing: {
			tight: { base: 'space-y-1' },
			normal: { base: 'space-y-2' },
			relaxed: { base: 'space-y-4' },
		},
		mb: {
			xs: 'mb-2',
			sm: 'mb-4',
			md: 'mb-6',
			lg: 'mb-8',
			xl: 'mb-12',
			'2xl': 'mb-16',
			none: '',
		},
		animate: {
			true: { base: 'animate-fade-in-up' },
		},
	},
	defaultVariants: {
		type: 'unordered',
		size: 'md',
		spacing: 'normal',
		mb: 'xs',
		animate: false,
	},
});

const listItemStyles = cva('flex items-start', {
	variants: {
		animate: {
			true: 'animate-fade-in-up',
		},
	},
});

interface ListProps {
	children: ReactNode;
	className?: string;
	type?: 'ordered' | 'unordered' | 'checked' | 'arrow';
	size?: 'sm' | 'md' | 'lg';
	spacing?: 'tight' | 'normal' | 'relaxed';
	mb?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
	animate?: boolean;
	animateItems?: boolean;
	color?: string;
}

/**
 * List component - Displays ordered or unordered lists with various styles
 */
export function List({
	children,
	className,
	type = 'unordered',
	size,
	spacing,
	mb,
	animate,
	animateItems = false,
	color,
}: ListProps) {
	const baseClasses = listStyles({ type, size, spacing, mb, animate });
	const item = listItemStyles({ animate: animateItems });

	// Custom color style
	const colorStyle = color ? { color } : {};

	// Determine list component based on type
	const ListComponent = type === 'ordered' ? 'ol' : 'ul';

	// Process children to add markers and animations
	const processedChildren = Children.map(children, (child, index) => {
		if (isValidElement(child)) {
			const itemAnimateClass = animateItems
				? `animate-fade-in-up animate-delay-${index * 100}`
				: '';

			let marker: ReactNode | null = null;
			if (type === 'checked') {
				marker = (
					<Check className="mt-2 mr-2 inline-block h-4 w-4 flex-shrink-0 text-green-500" />
				);
			} else if (type === 'arrow') {
				marker = (
					<ArrowRight className="mt-2 mr-2 inline-block h-4 w-4 flex-shrink-0" />
				);
			} else if (type === 'unordered') {
				marker = (
					<Circle className="mt-2 mr-2 inline-block h-2 w-2 flex-shrink-0" />
				);
			}

			return (
				<li className={`${item} ${itemAnimateClass}`}>
					{marker}
					<div>{child}</div>
				</li>
			);
		}
		return child;
	});

	return (
		<ListComponent className={cn(baseClasses, className)} style={colorStyle}>
			{processedChildren}
		</ListComponent>
	);
}

/**
 * ListItem component - Individual list item
 */
export function ListItem({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
