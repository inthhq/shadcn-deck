'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
	type CSSProperties,
	Suspense,
	useEffect,
	useRef,
	useState,
} from 'react';
import useMeasure from 'react-use-measure';
import { Button } from '~/components/ui/button';
import {
	observePrintReadiness,
	type PrintReadiness,
} from '~/pkgs/deck/features/print/lib/readiness';
import { slideDefinitions } from '~/presentation/router';
import './print.css';

function OverviewLink() {
	const pathname = usePathname();
	const query = useSearchParams();
	const prefix = pathname.match(/^\/ref\/[^/]+/)?.[0];
	const ref = query.get('ref');
	return (
		<Link
			href={`${prefix ?? (ref ? `/ref/${encodeURIComponent(ref)}` : '')}/grid`}
		>
			← Slide overview
		</Link>
	);
}

export default function PrintPage() {
	const pages = useRef<HTMLDivElement>(null);
	const [measure, bounds] = useMeasure();
	const [readiness, setReadiness] = useState<PrintReadiness>({
		ready: false,
		failedImages: 0,
	});
	useEffect(() => {
		if (!pages.current) return;
		return observePrintReadiness(pages.current, setReadiness);
	}, []);

	return (
		<main className="print-deck">
			<header className="print-toolbar">
				<Suspense fallback={<span>Slide overview</span>}>
					<OverviewLink />
				</Suspense>
				<span>{slideDefinitions.length} slides</span>
				<Button onClick={() => window.print()} disabled={!readiness.ready}>
					{readiness.ready ? 'Print / save as PDF' : 'Preparing slides…'}
				</Button>
				{readiness.failedImages > 0 && (
					<p role="status">
						Some images could not load. Check the preview before printing.
					</p>
				)}
			</header>
			<div ref={measure} className="print-preview">
				<div
					ref={pages}
					style={{ '--print-scale': bounds.width / 1280 } as CSSProperties}
				>
					{slideDefinitions.map((slide, index) => (
						<article
							className="print-page"
							key={slide.slug}
							aria-label={`Slide ${index + 1}: ${slide.title}`}
						>
							<div className="print-canvas">
								<slide.component />
							</div>
						</article>
					))}
				</div>
			</div>
		</main>
	);
}
