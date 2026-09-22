'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
// Import basic languages that will always be needed
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import html from 'react-syntax-highlighter/dist/cjs/languages/prism/markup';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import atomDark from 'react-syntax-highlighter/dist/cjs/styles/prism/atom-dark';
import vs from 'react-syntax-highlighter/dist/cjs/styles/prism/vs';
// Import themes from CJS build to avoid MIME type issues
import vscDarkPlus from 'react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus';
import { Button } from '~/components/ui/button';
import { observePromise } from '~/lib/observe-promise';
import { cn } from '~/lib/utils';

// Register the basic languages
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', html);

// Map of additional languages that can be loaded on demand
const additionalLanguages: Record<string, () => Promise<unknown>> = {
	python: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/python').then(
			(mod) => mod.default
		),
	java: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/java').then(
			(mod) => mod.default
		),
	bash: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/bash').then(
			(mod) => mod.default
		),
	json: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/json').then(
			(mod) => mod.default
		),
	markdown: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/markdown').then(
			(mod) => mod.default
		),
	yaml: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/yaml').then(
			(mod) => mod.default
		),
	sql: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/sql').then(
			(mod) => mod.default
		),
	go: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/go').then(
			(mod) => mod.default
		),
	rust: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/rust').then(
			(mod) => mod.default
		),
	c: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/c').then(
			(mod) => mod.default
		),
	cpp: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/cpp').then(
			(mod) => mod.default
		),
	csharp: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/csharp').then(
			(mod) => mod.default
		),
	ruby: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/ruby').then(
			(mod) => mod.default
		),
	php: () =>
		import('react-syntax-highlighter/dist/cjs/languages/prism/php').then(
			(mod) => mod.default
		),
};

// Keep track of loaded languages to avoid loading them multiple times
const loadedLanguages = new Set([
	'javascript',
	'typescript',
	'jsx',
	'tsx',
	'css',
	'html',
]);

interface CodeProps {
	children: string;
	className?: string;
	language?: string;
	showLineNumbers?: boolean;
	highlight?: number[];
	fontSize?: 'xs' | 'sm' | 'md' | 'lg';
	theme?: 'dark' | 'light' | 'vercel';
}

/**
 * Code component - Displays code blocks with syntax highlighting
 * Uses react-syntax-highlighter with CommonJS imports to avoid MIME type issues
 */
export function Code({ language = 'javascript', ...props }: CodeProps) {
	return <CodeBlock key={language} language={language} {...props} />;
}

function CodeBlock({
	children,
	className,
	language = 'javascript',
	showLineNumbers = false,
	highlight = [],
	fontSize = 'md',
	theme = 'vercel',
}: CodeProps) {
	const [copied, setCopied] = useState(false);
	const [isLanguageLoaded, setIsLanguageLoaded] = useState(
		loadedLanguages.has(language) || !additionalLanguages[language]
	);

	// Keep plain text visible while optional highlighting loads or if it fails.
	useEffect(() => {
		const load = additionalLanguages[language];
		if (loadedLanguages.has(language) || !load) {
			setIsLanguageLoaded(true);
			return;
		}
		return observePromise(
			load().then((langModule) => {
				SyntaxHighlighter.registerLanguage(language, langModule);
				loadedLanguages.add(language);
			}),
			() => setIsLanguageLoaded(true),
			() => setIsLanguageLoaded(true)
		);
	}, [language]);

	// Font size classes
	const fontSizeClasses = {
		xs: 'text-xs',
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
	};

	// Map theme to syntax highlighter style
	const getStyle = () => {
		switch (theme) {
			case 'light':
				return vs;
			case 'dark':
				return atomDark;
			default:
				return vscDarkPlus;
		}
	};

	// Handle copy to clipboard
	const handleCopy = () => {
		navigator.clipboard.writeText(children).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	// If the language is still loading, show a simple pre/code block
	if (!isLanguageLoaded) {
		return (
			<div
				aria-busy={true}
				className={cn(
					'relative overflow-hidden rounded-lg border border-[#333333] bg-[#1E1E1E] text-white',
					fontSizeClasses[fontSize],
					className
				)}
			>
				<pre className="overflow-x-auto p-4">
					<code>{children}</code>
				</pre>
			</div>
		);
	}

	return (
		<div
			aria-busy={false}
			className={cn(
				'group relative overflow-hidden rounded-lg border border-[#333333]',
				fontSizeClasses[fontSize],
				className
			)}
		>
			{/* Copy button */}
			<Button
				onClick={handleCopy}
				variant="ghost"
				size="icon"
				className="absolute top-2 right-2 z-10 rounded bg-[#333333] p-1 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
				aria-label="Copy code"
			>
				{copied ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<title>Copied</title>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<title>Copy</title>
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
					</svg>
				)}
			</Button>

			<SyntaxHighlighter
				language={language}
				style={getStyle()}
				showLineNumbers={showLineNumbers}
				wrapLines={true}
				lineProps={(lineNumber) => {
					const style: CSSProperties = { display: 'block' };
					if (highlight.includes(lineNumber)) {
						style.backgroundColor = 'rgba(0, 112, 243, 0.1)';
					}
					return { style };
				}}
				customStyle={{
					margin: 0,
					padding: '1rem',
					borderRadius: '0.5rem',
					fontSize: 'inherit',
				}}
			>
				{children}
			</SyntaxHighlighter>
		</div>
	);
}
