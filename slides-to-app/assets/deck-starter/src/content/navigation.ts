/** Deck identity and its sections, in order. Replace every value with text from the source deck. */
export const meta = {
  title: 'Deck title',
  subtitle: 'Deck subtitle',
  date: 'Month YYYY',
  confidentiality: 'Internal – Confidential',
}

export interface DeckSection {
  id: string
  /** Title on the section's divider slide (verbatim from the deck). */
  title: string
  /** Short label for the top bar tab. */
  tab: string
}

export const sections: DeckSection[] = [
  { id: 'opening', title: meta.title, tab: 'Opening' },
  { id: 'example', title: 'Example section', tab: 'Example' },
]
