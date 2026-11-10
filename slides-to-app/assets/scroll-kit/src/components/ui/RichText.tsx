import { Fragment } from 'react'
import type { Rich } from '../../content/types'

export type Tone = 'accent' | 'positive' | 'gold' | 'violet'

export interface RichToken {
  text: string
  tone?: Tone
  italic?: boolean
  bold?: boolean
}

const PATTERN = /\[\[(.+?)(?:\|(accent|positive|gold|violet))?\]\]|\*\*(.+?)\*\*|\*(.+?)\*/g

/** Parse the lightweight markup used in content files into styled tokens. */
export function parseRich(input: Rich): RichToken[] {
  const tokens: RichToken[] = []
  let last = 0
  for (const m of input.matchAll(PATTERN)) {
    if (m.index > last) tokens.push({ text: input.slice(last, m.index) })
    if (m[1] !== undefined) tokens.push({ text: m[1], tone: (m[2] as Tone) ?? 'accent' })
    else if (m[3] !== undefined) tokens.push({ text: m[3], bold: true })
    else if (m[4] !== undefined) tokens.push({ text: m[4], italic: true })
    last = m.index + m[0].length
  }
  if (last < input.length) tokens.push({ text: input.slice(last) })
  return tokens
}

export const toneClass: Record<Tone, string> = {
  accent: 'text-cyan',
  positive: 'text-won',
  gold: 'text-gold',
  violet: 'text-violet',
}

export function tokenClass(t: RichToken, accentClass = toneClass.accent) {
  return [
    t.tone ? (t.tone === 'accent' ? accentClass : toneClass[t.tone]) : '',
    t.italic ? 'italic' : '',
    t.bold ? 'font-semibold' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

interface Props {
  text: Rich
  /** Class applied to default-tone highlights; lets light surfaces use a deeper accent. */
  accentClass?: string
}

export function RichText({ text, accentClass }: Props) {
  return (
    <>
      {parseRich(text).map((t, i) => {
        const cls = tokenClass(t, accentClass)
        return cls ? (
          <span key={i} className={cls}>
            {t.text}
          </span>
        ) : (
          <Fragment key={i}>{t.text}</Fragment>
        )
      })}
    </>
  )
}
