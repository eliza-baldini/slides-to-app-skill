import type { Rich } from './types'

/** One content file per deck section. Every string is copied verbatim from the slide it came from. */
export const exampleSlide = {
  title: 'An example [[content]] slide',
  subtitle: 'Replace this file with the deck’s text, one export per slide',
  cards: [
    { title: 'First point', detail: 'Builds in on the first click-free build step.' },
    { title: 'Second point', detail: 'Then this one, after its pace delay.' },
    { title: 'Third point', detail: '**Bold** and *italic* and [[highlight]] markup work here.' },
  ] as { title: string; detail: Rich }[],
}
