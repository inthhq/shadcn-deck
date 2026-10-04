import Link from 'next/link';
import { Heading, Slide, Text } from '~/components/presentation';
import { Button } from '~/components/ui/button';
import type { SlideDefinition } from '~/pkgs/deck';

export const ThankYouSlide: SlideDefinition = {
	slug: 'thank-you-slide',
	component: SlideComponent,
	notes: 'Thank you for attending my presentation. I hope you found it informative and engaging.',
	title: 'Thank you for attending my presentation',
};

function SlideComponent() {
	return (
		<Slide contentPosition="center" padding='large'>
			<Heading size="2xl" align="center" mb='md'>
				<div className="flex items-center justify-center gap-2 font-medium">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 256 256"
						className="h-12 w-12"
					>
						<title>shadcn/deck logo</title>
						<rect width="256" height="256" fill="none" />
						<line
							x1="208"
							y1="128"
							x2="128"
							y2="208"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="32"
						/>
						<line
							x1="192"
							y1="40"
							x2="40"
							y2="192"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="32"
						/>
					</svg>{' '}
					shadcn/deck
				</div>
			</Heading>
			<Text
				size="lg"
				align="center"
				animate
				className="mx-auto max-w-3xl text-2xl"
			>
				This entire presentation was built using shadcn/deck - a modern
				presentation system using shadcn/ui components
			</Text>
			<div className="mt-10 flex justify-center space-x-4">
				<Button variant="outline" size="xl" asChild>
					<Link href="https://github.com/inthhq/shadcn-deck">
					<svg
							xmlns="http://www.w3.org/2000/svg"
							className="size-5"
							viewBox="0 0 640 640"
						>
							<title> github icon</title>
							<path
								fill="currentColor"
								d="M237.9 461.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2 .6-2-1.3-4.3-4.3-5.2-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM316.8 72C178.1 72 72 177.3 72 316c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5 21.3 0 42.8 2.9 62.8 8.5 0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C500.2 521.8 568 426.9 568 316c0-138.7-112.5-244-251.2-244zM169.2 416.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
							/>
						</svg> inthhq/shadcn-deck
					</Link>
				</Button>
			</div>
		</Slide>
	);
}
