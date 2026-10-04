'use client';

import { useEffect, useId, useState } from 'react';
import { observePromise } from '~/lib/observe-promise';

type MermaidProps = {
	diagram: string;
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

let mermaidPromise: Promise<typeof import('mermaid').default> | undefined;

function loadMermaid() {
	mermaidPromise ??= import('mermaid')
		.then(({ default: mermaid }) => {
			mermaid.initialize({
				startOnLoad: false,
				theme: 'base',
				flowchart: { useMaxWidth: true },
				suppressErrorRendering: true,
			});
			return mermaid;
		})
		.catch((error: unknown) => {
			mermaidPromise = undefined;
			throw error;
		});
	return mermaidPromise;
}

export function Mermaid({ diagram, size = 'lg' }: MermaidProps) {
	if (!diagram) return null;
	return <MermaidDiagram key={diagram} diagram={diagram} size={size} />;
}

function MermaidDiagram({ diagram, size = 'lg' }: MermaidProps) {
	const [result, setResult] = useState<
		{ svg: string; failed: boolean } | undefined
	>();
	const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

	useEffect(() => {
		return observePromise(
			loadMermaid().then((mermaid) => mermaid.render(id, diagram)),
			({ svg }) => setResult({ svg, failed: false }),
			() => setResult({ svg: '', failed: true })
		);
	}, [diagram, id]);

	const sizeClasses = {
		sm: 'max-w-2xl',
		md: 'max-w-4xl',
		lg: 'max-w-6xl',
		xl: 'max-w-7xl',
		full: 'max-w-full',
	};

	return (
		<div
			aria-busy={!result}
			className={`flex w-full justify-center ${sizeClasses[size]}`}
		>
			{result?.failed ? (
				<div className="w-full rounded-lg border border-border p-4">
					<p role="status">Unable to render this diagram.</p>
					<pre className="mt-2 overflow-auto whitespace-pre-wrap text-sm">
						<code>{diagram}</code>
					</pre>
				</div>
			) : result ? (
				<div
					className="flex w-full justify-center"
					dangerouslySetInnerHTML={{ __html: result.svg }}
				/>
			) : (
				<p role="status">Loading diagram…</p>
			)}
		</div>
	);
}
