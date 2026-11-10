# Format: scrollable page

One continuous, scroll-told page: a premium product-site feel, not stacked slides. Primitives from a previous build are in `assets/scroll-kit/` — copy what you need and adapt them (they import `content/navigation` and `content/types`; recreate those for the new deck).

## Contents
1. Principles
2. Page structure
3. Kit contents
4. Motion vocabulary
5. Section recipes
6. Verification

## 1. Principles

- **Reimagine, don't replicate.** The deck gives content and narrative; vary layouts so it never reads as slide after slide.
- **Scroll-connected motion, smooth and purposeful.** Reveal progressively with subtle stagger; pin key diagrams and scrub them with scroll. Polish over features.
- **Easy to update.** All copy in `src/content/*`; deck updates shouldn't require redesign.
- **Desktop first, mobile compatible.** Under 1024px, pinned sections fall back to simple stacked reveals.
- Stack: React + Vite + TS, Tailwind v4 (`@theme` tokens in `index.css`), `motion`, `lenis` smooth scroll, self-hosted `@fontsource-variable` fonts.

## 2. Page structure

- **Hero** (slide 1): title words slide up from a mask, art builds in; on scroll the hero scales to ~0.9 and rounds its corners, receding into a card.
- **Chapter intros** (one per deck section/divider): giant faint numeral with parallax, title slides in, list of the chapter's sections.
- **Sections** (one per content slide, or one per pair when slides belong together).
- **Footer**: logo, title, date, "Back to top", confidentiality label.
- **Chrome**: floating glass top bar (title, chapter links with a sliding active pill, thin scroll-progress line) that turns translucent-dark over `data-surface="dark"` sections; a right-edge dot rail (one dot per section, active dot stretches to a pill, labels on hover).

## 3. Kit contents (`assets/scroll-kit/src/`)

| File | What it does |
|---|---|
| `components/motion/Reveal.tsx` | `Reveal` (fade/lift once in view), `Stagger`/`StaggerItem`, `easeOutExpo` |
| `components/motion/ScrollWords.tsx` | Scroll-scrubbed word-by-word lighting, own progress or a parent's |
| `components/motion/CountUp.tsx` | Animated figures keeping prefixes/suffixes ("$NNM+", "~NN%") |
| `components/motion/SmoothScroll.tsx` | Lenis wrapper (`lerp 0.18`), `useScrollTo`, disabled under reduced motion |
| `components/layout/TopBar.tsx`, `SectionRail.tsx`, `ChapterIntro.tsx`, `SectionHeading.tsx`, `Footer.tsx` | Chrome described above |
| `components/ui/RichText.tsx`, `TableauMark.tsx` | Markup parser; simplified Tableau plus mark |
| `hooks/useActiveSection.ts`, `useMediaQuery.ts` (`useIsDesktop`), `useSurfaceAt.ts` | Active section by a 0.4-viewport line; breakpoints; dark-surface sampling |
| `index.css` | Tableau theme tokens, `.display`, `.eyebrow`, `.card`, `.glass`, `.grain`, reduced-motion rule |
| `package.json` | Dependency versions that worked together |

## 4. Motion vocabulary

- Easing `cubic-bezier(0.16, 1, 0.3, 1)` everywhere.
- `Reveal`: opacity 0→1, y 28→0, 1s, `amount 0.35`, once. `Stagger` 0.08s.
- **Pinned sections:** a tall `<section>` (180–300vh) around a `sticky top-0 h-screen` stage; `useScroll({ target, offset: ['start start', 'end end'] })` → `useTransform` to drive each element. Use `justify-center-safe` so tall content never clips under the top bar. Give each pinned section a non-pinned mobile layout.
- **Horizontal tracks** (landscapes with many panels): section height = 100vh + track overflow, measured with a `ResizeObserver`; scroll progress translates the track.
- **Connectors between elements:** measure with `offsetLeft/offsetTop` chains (not `getBoundingClientRect`, which reveal transforms skew), draw SVG paths with `pathLength`.

## 5. Section recipes

- **Linear process → dead end:** sticky statement panel on the left lighting word by word; numbered stage cards on the right with a filling rail; a dashed return path that draws itself and ends in a red ✕.
- **Then vs. now:** two panels; the second slides in while the first dims and scales to 0.97; persona cards light up in turn.
- **Layered stack / architecture:** layers drop in bottom-up; the newest layer is "active" (lit) and its list item highlights; hover lights a layer.
- **Loops / lifecycles:** SVG loops draw via `pathLength`, a center orb scales in, pulses travel the loops (`animateMotion`).
- **Step rings:** a progress ring draws with scroll; the active step's text crossfades.
- **Comparison tables:** harvey balls sweep in column by column; hovering a vendor column washes it and dims others.
- **Range bars (months to parity, etc.):** bars grow from their left edge per row as each row scrolls in.

Reuse photos and logos from the deck exactly as in the deck format (`references/reading-the-deck.md` §4).

## 6. Verification

Check at 1280×720, 1440×900 and 375×812 (`preview_resize`): nothing clips under the top bar in pinned sections, no horizontal overflow, no console errors, images load. The hidden pane throttles animation frames — scroll with `preview_eval` (`window.scrollTo`), then screenshot twice before judging a reveal. Then `npm run build` and lint.
