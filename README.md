# shadcn/deck

A modern, component-based presentation deck system built with Next.js and shadcn UI components.

![CleanShot 2025-04-29 at 11  34 01@2x](https://github.com/user-attachments/assets/6cd1169d-b9e8-4042-aa33-134f2a6e6fda)

## Overview

shadcn/deck is a flexible presentation framework that allows you to create beautiful slide decks using React components. Perfect for:

- Technical presentations
- Product demos
- Conference talks
- Educational content

## Features

- 🧩 **Component-based slides** - Build presentations with reusable React components
- 🎨 **Multiple slide types** - Title, Code, Image, Grid, Quote, and more
- 📝 **Presenter notes** - Keep track of talking points for each slide
- 📱 **Responsive design** - Presentations look great on any device
- 🌙 **Dark mode support** - Presentations that work in any lighting condition
- ⌨️ **Keyboard navigation** - Easily move between slides
- 🖼️ **Fullscreen mode** - Immersive presentation experience

## Getting Started

Requires Node.js 22.12 or later and pnpm 12.4.2 (pinned in `package.json`).

1. Clone the repository:

```bash
git clone https://github.com/inthhq/shadcn-deck.git
cd shadcn-deck
```

2. Install dependencies:

```bash
corepack enable
pnpm install --frozen-lockfile
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see your presentation.

To verify changes, run `pnpm test`, `pnpm lint`, `pnpm type-check`, and `pnpm build`.

## PDF export

Open **Print view** from the slide controls, then choose **Print / save as PDF**.
The preview preserves the deck's theme and exports one 16:9 slide per page.
The button waits for fonts, image decoding (including `Slide.backgroundImage`)
and components marked `aria-busy="true"`. Offscreen images load eagerly. Failed
images are reported so you can check the preview before printing.

For custom asynchronous slide content, keep `aria-busy="true"` on its wrapper
until its content or error fallback is rendered. Use the browser's background
graphics option if your PDF print settings omit slide colours.

## Creating Slides

Slides are defined in `src/presentation/router.ts`. Each slide has:

- A unique ID
- A path for routing
- A component reference
- Presenter notes
- A title

Example slide definition:

```typescript
{
  id: '1',
  path: '/1',
  component: TitleSlide,
  notes: 'Welcome to the presentation!',
  title: 'My Awesome Presentation',
}
```

## Presenter workspace

Open **Presenter view** from the slide controls, or visit `/presenter/<slide-slug>`.
The workspace puts speaker notes beside 16:9 current and next slide previews.

- Resize the notes pane with the divider or its arrow keys, expand it, and adjust text size.
- Auto-scroll longer notes at 80–220 words per minute. Scrolling or interacting with the notes pauses it; reduced-motion preferences disable automatic playback.
- Search the slide outline by number, title or section, or jump directly to a slide number.
- Open the audience view in another window on the same browser and origin. The status confirms which slide that window has rendered; closing it clears the connection.
- Start, pause and save rehearsals. Per-slide timings include revisits; the last ten completed runs and an unfinished run are saved in this browser. Reloading restores an unfinished rehearsal paused.

Speaker notes accept plain text (blank lines separate paragraphs) or React content.
Optional metadata adds timing targets in seconds and outline sections:

```tsx
{
  slug: 'introduction',
  title: 'Introduction',
  component: IntroductionSlide,
  notes: 'Welcome to the presentation.\n\nHere is what we will cover.',
  metadata: { duration: 60, tags: ['Opening'] },
}
```

Give every main slide a positive `metadata.duration` to enable a countdown and
pacing feedback. The countdown totals the targets from the rehearsal's starting
slide to the end; without a complete plan, the timer shows elapsed time. Add the
`Appendix` tag to exclude a slide from the plan and pacing comparisons. Rehearsal
history still records time spent on appendix slides.

Notes preferences and rehearsal history are local to this browser and origin.
Audience synchronisation uses `BroadcastChannel`; it does not connect separate
browsers or devices.

## Available Slide Components

- **TitleSlide** - Main title slide for your presentation
- **ComponentOverviewSlide** - Show component architecture
- **GridSlide** - Display content in a responsive grid
- **CodeSlide** - Share and highlight code examples
- **QuoteSlide** - Feature important quotes
- **ImageSlide** - Display images with captions
- **KeyFeaturesSlide** - Highlight key features or points
- **FullscreenSlide** - Create immersive full-screen content
- **ThankYouSlide** - End your presentation professionally

## Customization

You can create your own slide components by adding them to the `src/presentation/slides` directory and importing them in the router.

## Author

[Christopher Burns](https://x.com/burnedchris)

## License

MIT
