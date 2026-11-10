import type { ReactNode } from 'react'
import type { Rich } from '../content/types'
import { RichText } from '../components/ui/RichText'
import { Build } from './Build'

interface Props {
  eyebrow?: string
  title?: ReactNode
  subtitle?: Rich
  inverted?: boolean
  /** Accent for highlighted words in the subtitle. */
  accentClass?: string
  children: ReactNode
  className?: string
  headerClassName?: string
}

/** Standard slide layout on the 1600×900 canvas: header built on arrival, body below. */
export function SlideFrame({
  eyebrow,
  title,
  subtitle,
  inverted,
  accentClass,
  children,
  className = '',
  headerClassName = '',
}: Props) {
  return (
    <div className={`relative flex h-full flex-col px-24 pt-[72px] pb-16 ${inverted ? 'text-white' : 'text-ink'} ${className}`}>
      {(eyebrow || title) && (
        <header className={`relative shrink-0 ${headerClassName}`}>
          {eyebrow && (
            <Build y={12} duration={0.7}>
              <div className="mb-5 flex items-center gap-3">
                <span className={`eyebrow text-[13px] ${inverted ? 'text-cyan' : 'text-royal'}`}>{eyebrow}</span>
              </div>
            </Build>
          )}
          {title && (
            <Build delay={0.05} y={20}>
              <h2 className="display max-w-[1250px] text-[54px] leading-[1.04] text-balance">{title}</h2>
            </Build>
          )}
          {subtitle && (
            <Build delay={0.12} y={16}>
              <p className={`mt-4 max-w-[1150px] text-[22px] leading-snug ${inverted ? 'text-white/70' : 'text-ink-soft'}`}>
                <RichText text={subtitle} accentClass={accentClass} />
              </p>
            </Build>
          )}
        </header>
      )}
      <div className="relative mt-8 flex min-h-0 flex-1 flex-col justify-center-safe">{children}</div>
    </div>
  )
}
