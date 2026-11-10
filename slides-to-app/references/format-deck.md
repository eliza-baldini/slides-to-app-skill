# Format: presentable deck

A click-through presentation that runs in the browser. Start from `assets/deck-starter/` (it builds as-is) and replace its example content.

## Contents
1. What the user gets
2. Engine (already in the starter)
3. Writing a slide
4. Patterns that worked
5. Corrections users asked for (defaults now)
6. Verification

## 1. What the user gets

- A fixed **1600×900 canvas** scaled to fit any window (letterboxed with the slide's background), so layouts are pixel-designed once.
- **One input = one slide.** →, Space, PageDown, swipe, or the next button move a whole slide. Builds within a slide **auto-play** on arrival; the presenter never clicks through bullets.
- Top bar: logo + deck title, **section tabs** (one per deck section, active one underlined), slide counter `N / total`, **Overview** (grid of all slides, `O` key, Esc closes), prev/next buttons.
- Keys: ←/→, Space, PageUp/PageDown, Home/End, O, Esc. URL hash `#slide-id` deep-links to a slide.
- Slide transitions are direction-aware (slide + blur). Going back arrives fully built.

## 2. Engine (already in the starter)

| File | Role |
|---|---|
| `src/deck/slides.tsx` | Registry: `SlideDef { id, title, chapter, steps, pace?, surface, group?, props?, Component }`, `sectionDivider(id)`, `with_(C, props)`, `CANVAS_W/H`, `surfaceBg`, `buildDelay`, `PACE_SCALE` |
| `src/deck/DeckContext.tsx` | `index`, `step`, `direction`, `next/prev/goTo`, autoplay timer (`buildDelay(index, step)`), hash sync, overview state |
| `src/deck/Stage.tsx` | Scales the canvas, `AnimatePresence` keyed by `slide.group ?? slide.id`, provides `SlideStepContext { step, settled, goToStep }` |
| `src/deck/Build.tsx` | `<Build at delay x y scale blur duration>`, `useBuilt(at)`, `useBuildTransition(at, delay, duration)`, `useSlideStep()`, `easeOutExpo` |
| `src/deck/SlideFrame.tsx` | Standard layout: eyebrow/title/subtitle header + centered body (`inverted` for dark surfaces) |
| `src/deck/Words.tsx` | Word-by-word reveal tied to a build step |
| `src/deck/NavBar.tsx`, `Overview.tsx` | Chrome |
| `src/slides/Opening.tsx` | `Opening` title slide and `Divider` section slides (Tableau-style blue gradient art — restyle for other themes) |
| `src/components/ui/RichText.tsx` | `[[highlight]]`, `[[text|tone]]`, `**bold**`, `*italic*` markup |
| `src/components/motion/CountUp.tsx` | Animated figures with `play` / `instant` |

`surface` is `'paper' | 'navy' | 'blue'`; it sets the stage background and letterbox. Add surfaces in `surfaceBg` if the theme needs them.

**Pacing.** `steps` = number of build states (1 = static). `pace[i]` = ms to wait before build i+1 (pace[0] is after arrival). Default 600 ms.

**Speed controls.** Two global settings change the whole deck's tempo:
- `PACE_SCALE` (`src/deck/slides.tsx`) scales the pauses between builds.
- `MOTION_SCALE` (`src/deck/Build.tsx`) scales every animation's duration and delay. `Build`, `useBuildTransition`, `Words` and the slide transition already use it. Wrap any transition you write yourself in `timed({...})` so it follows too.

For "faster/slower" requests change both together. Speed requests are often ambiguous: "increase load time by 2x" meant *twice as fast*, and "slow down by .25x" could mean 25% slower or quarter speed. Ask which one with `AskUserQuestion` before changing anything.

## 3. Writing a slide

```tsx
/** Slide 7 · Title from the deck. Builds: 0 title · 1–3 each card · 4 closing line. */
export function MySlide() {
  return (
    <SlideFrame title={<RichText text={c.title} accentClass="text-royal" />} subtitle={c.subtitle}>
      <div className="grid grid-cols-3 gap-6">
        {c.items.map((it, i) => (
          <Build key={it.title} at={i + 1} y={30} className="h-full">…</Build>
        ))}
      </div>
      <Build at={4} className="mt-6">…</Build>
    </SlideFrame>
  )
}
```
Register it: `{ id: 'my-slide', title: '…', steps: 5, pace: [600, 500, 500, 600], surface: 'paper', Component: MySlide }`. Document the build map in the doc comment; it keeps `steps` honest.

For custom animated pieces (fills, rings, connectors) use `useBuilt(at)` + `useBuildTransition(at, delay, duration)` on a `motion.*` element with `initial={false}`.

## 4. Patterns that worked

- **Slides that build on each other share one canvas.** When consecutive deck slides are the same diagram with overlays added (today → roadmap → pivot), register them with the same `group` and the same `Component`, passing the stage via `props`. The Stage keeps it mounted, so only the differences animate: header text crossfades (`AnimatePresence mode="wait"` keyed by the text), legends swap, fills grow, new logos fade in. Use `with_(C, props)` instead when variants of a template should transition normally.
- **Coverage overlays** (a box "X% covered"): absolutely positioned fills behind the text with animated `width`; put `isolate` on the box and `-z-10` on fills so they stay behind text. Outlines inside `overflow-hidden` boxes need `ring-inset` or they vanish.
- **Era/compare pairs:** two cards joined by a drawn connector; left at build 1, connector + right at build 2.
- **Persona cards:** the deck's real portrait (round avatar or tall rounded rectangle, matching the slide), badge, name, title, quote, icon list; tools as **logos**, not text chips, when the slide shows logos.
- **Figures** use `CountUp` keyed to their build; pass `instant` when `settled >= at` so going back doesn't replay.
- **Tables/scores** drawn as graphics on the slide: read them from a `WIDTH2000_PX` thumbnail and model them as data.
- Keep a `Glyph` icon set for list bullets instead of emoji.

## 5. Corrections users asked for (defaults now)

- No presenter timer, no speaker-notes drawer or "Details" toggle, no progress/loading bar under the nav — unless asked.
- Builds auto-play; one click per slide.
- Don't include excluded slides anywhere (content, bundle, overview).
- Section tabs come from the deck's divider slides.

## 6. Verification

- Dev server via `.claude/launch.json` + `preview_start`. The hidden Browser pane throttles animation frames: take a screenshot (or two) or reload before judging a build; a slide stuck at opacity 0 after rapid hash jumps is usually that, so reload.
- Jump to slides with `location.hash = '#slide-id'` in `preview_eval`; drive builds with `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`.
- **Overflow check** on every slide: in `preview_eval`, compare each element's bounding box with its parent's and with the canvas (1600×900 after dividing by the scale); report clipped or overlapping text. Common fixes: fixed grid row heights, `min-h-0` + `overflow-hidden` on mockups, shorter type scale, `whitespace-nowrap` legends.
- All `<img>` loaded: `[...document.images].filter(i => !i.naturalWidth)` is empty.
- For grouped slides, confirm the canvas element survives navigation (set a `data-` marker, step forward, check it's still there).
- `npm run build` and `npm run lint` clean (fast-refresh warnings are fine). Tailwind only sees static class strings — build class names from lookup objects, never by string concatenation.
