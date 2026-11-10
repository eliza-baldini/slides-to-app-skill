import type { ComponentType } from 'react'
import { meta, sections } from '../content/navigation'
import { ExampleSlide } from '../slides/ExampleSlide'
import { Divider, Opening } from '../slides/Opening'

/** Design size of every slide; the stage scales it to fit the screen. */
export const CANVAS_W = 1600
export const CANVAS_H = 900

export type Surface = 'paper' | 'navy' | 'blue'

/** Slide background, also used to fill the letterbox around the canvas. */
export const surfaceBg: Record<Surface, string> = {
  paper: '#f5f9ff',
  navy: '#000f33',
  blue: 'linear-gradient(160deg,#0418a8 0%,#0a2fd0 55%,#0418a8 100%)',
}

export interface SlideDef {
  id: string
  /** Position in the app. */
  number: number
  title: string
  /** Section tab this slide belongs to. */
  chapter: string
  /** Number of build states (1 = no builds). */
  steps: number
  /**
   * Milliseconds to wait before each automatic build: pace[0] is the wait after the slide
   * arrives before build 1, pace[1] before build 2, and so on. Falls back to DEFAULT_PACE.
   */
  pace?: number[]
  surface: Surface
  /**
   * Consecutive slides with the same group share one canvas: moving between them keeps the
   * component mounted (no slide transition) and only its props change, so it can build on itself.
   */
  group?: string
  props?: object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each slide pairs Component with its own props
  Component: ComponentType<any>
}

const divider = (id: string): ComponentType => () => <Divider title={sections.find((s) => s.id === id)!.title} />
export const with_ = <P extends object>(C: ComponentType<P>, props: P): ComponentType => () => <C {...props} />

type Entry = Omit<SlideDef, 'number' | 'chapter'>

const sectionDivider = (id: string): Entry => ({
  id: `${id}-divider`,
  title: sections.find((s) => s.id === id)!.title,
  steps: 1,
  surface: 'blue',
  Component: divider(id),
})

/**
 * Slides per deck section, in deck order. Each entry: id (also the URL hash), title, steps (build states,
 * 1 = none), pace (ms before each auto-build), surface, Component.
 *
 * Slides that build on one diagram share a `group` and one Component with different `props`:
 * moving between them keeps the canvas mounted, so only the changes animate. Example:
 *   { id: 'arch-today', group: 'arch', Component: Architecture, props: { stage: 'today' }, ... },
 *   { id: 'arch-roadmap', group: 'arch', Component: Architecture, props: { stage: 'roadmap' }, ... },
 * Variants of one template that should transition normally use with_(Component, props) instead.
 */
const bySection: Record<string, Entry[]> = {
  opening: [{ id: 'opening', title: `${meta.title} ${meta.subtitle}`, steps: 1, surface: 'blue', Component: Opening }],
  example: [
    sectionDivider('example'),
    { id: 'example-slide', title: 'An example content slide', steps: 4, pace: [600, 500, 500], surface: 'paper', Component: ExampleSlide },
  ],
}

export const slides: SlideDef[] = sections
  .flatMap((sec) => (bySection[sec.id] ?? []).map((s) => ({ ...s, chapter: sec.id })))
  .map((s, i) => ({ ...s, number: i + 1 }))

/** Tabs for the top bar: one per deck section, pointing at its first slide. */
export const sectionTabs = sections.map((s) => ({ id: s.id, label: s.tab, first: slides.findIndex((sl) => sl.chapter === s.id) }))

const DEFAULT_PACE = 600

/** Multiplier on every slide's pacing: below 1 is faster, above 1 slower. */
export const PACE_SCALE = 1

/** Delay before advancing from `step` to `step + 1` on slide `index`. */
export function buildDelay(index: number, step: number) {
  return (slides[index].pace?.[step] ?? DEFAULT_PACE) * PACE_SCALE
}
