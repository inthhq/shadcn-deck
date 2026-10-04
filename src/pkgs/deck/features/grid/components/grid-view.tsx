'use client';

import { X } from 'lucide-react';
import * as m from 'motion/react-m';
import { type ReactNode, useEffect } from 'react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useDeck } from '../../../core/layouts/deck-context';

interface GridViewProps {
	isOpen: boolean;
	onClose: () => void;
	slideThumbnails: ReactNode[];
}

export function GridView({ isOpen, onClose, slideThumbnails }: GridViewProps) {
	const { activeSlide, goToSlide } = useDeck();

	// Handle escape key to close
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	// Prevent scrolling when grid is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	return (
		<m.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className="fixed inset-0 z-50 overflow-y-auto bg-background/90"
		>
			<div className="container mx-auto px-6 py-8">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-bold text-2xl text-foreground">All Slides</h2>
					<Button
						onClick={onClose}
						variant="ghost"
						size="icon"
						className="rounded-full"
						aria-label="Close grid view"
					>
						<X className="size-5" />
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
					{slideThumbnails.map((slideContent, index) => (
						// biome-ignore lint/a11y/noStaticElementInteractions: we get hydration errors otherwise
						// biome-ignore lint/a11y/useKeyWithClickEvents: we get hydration errors otherwise
						<div
							key={index}
							className={cn(
								'h-auto w-full cursor-pointer overflow-hidden rounded-lg border-2 p-0 transition-all hover:scale-105',
								index === activeSlide
									? 'border-primary ring-2 ring-primary/50'
									: 'border-border'
							)}
							onClick={() => {
								goToSlide(index);
								onClose();
							}}
						>
							<div className="relative aspect-video w-full overflow-hidden">
								{slideContent}
								<div className="absolute right-2 bottom-1 z-10 rounded-sm bg-background/80 px-2 py-0.5 text-foreground text-xs">
									{index + 1}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</m.div>
	);
}
