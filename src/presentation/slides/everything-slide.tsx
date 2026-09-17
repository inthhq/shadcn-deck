import {
	Code,
	ImageIcon,
	LayoutGrid,
	Maximize,
	Monitor,
	Moon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Box, Grid, Heading, Slide, Text } from '~/components/presentation';
import { cn } from '~/lib/utils';
import type { SlideDefinition } from '~/pkgs/deck/core/types/types';

const iconContainerClasses =
	'flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:text-primary-foreground';

function FeatureBox({
	title,
	text,
	icon: Icon,
}: {
	title: string;
	text: string;
	icon: LucideIcon;
}) {
	return (
		<Box border rounded="lg" padding="md" className="h-full w-full justify-between">
			<div className="mb-1 flex items-center gap-3">
				<div className={cn(iconContainerClasses)}>
					<Icon className="size-5" />
				</div>
				<Heading size="md" className="mb-0">
					{title}
				</Heading>
			</div>
			<Text className="flex h-full justify-between text-lg">{text}</Text>
		</Box>
	);
}
export const EverythingSlide: SlideDefinition = {
	slug: 'everything-slide',
	component: SlideComponent,
	notes: `Features:
	- Code Blocks
	- Image Support
	- Grid / flex Support
	- React Server Components
	- Light/ Dark Mode
	- Responsive Design`,
	title: 'What if it had everything built in?',
};

function SlideComponent() {
	return (
		<Slide contentPosition="center" padding='large'>
			<Heading size="2xl">What if it had everything built in?</Heading>
			<Grid columns={3} gap="md" className="mt-10">
				<FeatureBox
					title="Code Blocks"
					text="Showcase syntax-highlighted code with line focus."
					icon={Code}
				/>
				<FeatureBox
					title="Image Support"
					text="Drop in screenshots, diagrams, and rich media."
					icon={ImageIcon}
				/>
				<FeatureBox
					title="Grid / flex Support"
					text="Structure content responsively and visually."
					icon={LayoutGrid}
				/>
				<FeatureBox
					title="React Server Components"
					text="Use server components to render your slides."
					icon={Maximize}
				/>
				<FeatureBox
					title="Light/ Dark Mode"
					text="Adapts to your environment."
					icon={Moon}
				/>
				<FeatureBox
					title="Responsive Design"
					text="Adapts to screen size with elegance."
					icon={Monitor}
				/>
			</Grid>
		</Slide>
	);
}
