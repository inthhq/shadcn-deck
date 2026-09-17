'use client';

import mermaid from 'mermaid';
import { useEffect, useState } from 'react';

const randomId = () => `mermaid-${Math.random().toString(36).slice(2)}`;

type MermaidProps = {
	diagram: string;
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

export function Mermaid({ diagram, size = 'lg' }: MermaidProps) {
	const [svg, setSvg] = useState('');
	const [id] = useState(randomId());

	useEffect(() => {
		mermaid.initialize({
			startOnLoad: true,
			theme: 'base',
			flowchart: { useMaxWidth: true },
		});

		if (diagram) {
			mermaid.render(id, diagram).then(({ svg }) => {
				setSvg(svg);
			});
		}
	}, [diagram, id]);

	if (!diagram) {
		return null;
	}

	const sizeClasses = {
		sm: 'max-w-2xl',
		md: 'max-w-4xl',
		lg: 'max-w-6xl',
		xl: 'max-w-7xl',
		full: 'max-w-full',
	};

	return (
		<div
			className={`flex w-full justify-center ${sizeClasses[size]}`}
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}
