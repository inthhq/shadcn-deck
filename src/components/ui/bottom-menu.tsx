'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
	type HTMLAttributes,
	type ReactElement,
	type SVGProps,
	useEffect,
	useRef,
	useState,
} from 'react';

import { cn } from '~/lib/utils';

export interface MenuBarItem {
	icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
	label: string;
	onClick?: () => void;
	disabled?: boolean;
	shortcut?: string;
}

interface MenuBarProps extends HTMLAttributes<HTMLDivElement> {
	items: MenuBarItem[];
	highlight?: number;
}

const springConfig = {
	duration: 0.3,
	ease: 'easeInOut',
};

export function MenuBar({
	items,
	className,
	highlight,
	...props
}: MenuBarProps) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [tooltipPosition, setTooltipPosition] = useState({
		left: 0,
		width: 0,
	});
	const tooltipRef = useRef<HTMLDivElement>(null);

	// Track when buttons are actively pressed
	const [pressedIndex, setPressedIndex] = useState<number | null>(null);

	useEffect(() => {
		if (activeIndex !== null && menuRef.current && tooltipRef.current) {
			const menuItem = menuRef.current.children[activeIndex] as HTMLElement;
			const menuRect = menuRef.current.getBoundingClientRect();
			const itemRect = menuItem.getBoundingClientRect();
			const tooltipRect = tooltipRef.current.getBoundingClientRect();

			const left =
				itemRect.left -
				menuRect.left +
				(itemRect.width - tooltipRect.width) / 2;

			setTooltipPosition({
				left: Math.max(0, Math.min(left, menuRect.width - tooltipRect.width)),
				width: tooltipRect.width,
			});
		}
	}, [activeIndex]);

	return (
		<div className={cn('relative', className)} {...props}>
			<AnimatePresence>
				{activeIndex !== null && (
					<motion.div
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 5 }}
						// @ts-expect-error - compatibility with motion/react
						transition={springConfig}
						className="pointer-events-none absolute -top-[31px] right-0 left-0 z-50"
					>
						<motion.div
							ref={tooltipRef}
							className={cn(
								'inline-flex h-7 items-center justify-center overflow-hidden rounded-lg px-3',
								'bg-[#222222] backdrop-blur',
								'border border-[#333333]',
								'shadow-[0_0_0_1px_rgba(0,0,0,0.08)]'
							)}
							initial={{ x: tooltipPosition.left }}
							animate={{ x: tooltipPosition.left }}
							// @ts-expect-error - compatibility with motion/react
							transition={springConfig}
							style={{ width: 'auto' }}
						>
							<p className="whitespace-nowrap font-medium text-[13px] text-white leading-tight">
								{items[activeIndex].label}
								{items[activeIndex].shortcut && (
									<span className="ml-2 text-[11px] opacity-70">
										{items[activeIndex].shortcut}
									</span>
								)}
							</p>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div
				ref={menuRef}
				className={cn(
					'z-10 inline-flex h-12 items-center justify-center gap-[4px] overflow-hidden px-2',
					'rounded-full bg-[#222222] backdrop-blur',
					'border border-[#333333]',
					'shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_16px_-4px_rgba(0,0,0,0.1)]'
				)}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
			>
				{items.map((item, index) => {
					const isActive = highlight === index;
					const isPressed = pressedIndex === index;
					const isDisabled = item.disabled;

					return (
						<motion.button
							key={index}
							className={cn(
								'relative flex size-10 items-center justify-center gap-2 rounded-full px-3 py-1',
								'transition-colors duration-150',
								isActive ? 'bg-[#333333]' : 'hover:bg-[#333333]',
								isPressed && 'scale-95',
								isDisabled && 'cursor-not-allowed opacity-40'
							)}
							onMouseEnter={() => !isDisabled && setActiveIndex(index)}
							onMouseLeave={() => setActiveIndex(null)}
							onMouseDown={() => !isDisabled && setPressedIndex(index)}
							onMouseUp={() => setPressedIndex(null)}
							onClick={(e) => {
								if (!isDisabled && item.onClick) {
									e.preventDefault();
									item.onClick();
								}
							}}
							disabled={isDisabled}
							whileTap={{ scale: isDisabled ? 1 : 0.95 }}
						>
							<div className="flex items-center justify-center">
								<div className="flex size-5 items-center justify-center overflow-hidden text-white">
									<item.icon className="h-full w-full" />
								</div>
							</div>
							<span className="sr-only">{item.label}</span>
						</motion.button>
					);
				})}
			</motion.div>
		</div>
	);
}
