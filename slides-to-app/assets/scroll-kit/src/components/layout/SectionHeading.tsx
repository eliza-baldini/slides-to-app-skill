import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { Rich } from '../../content/types'
import { easeOutExpo } from '../motion/Reveal'
import { RichText } from '../ui/RichText'

interface Props {
  eyebrow?: string
  title: ReactNode
  subtitle?: Rich
  inverted?: boolean
  align?: 'left' | 'center'
  size?: 'md' | 'lg' | 'xl'
  aside?: ReactNode
  className?: string
}

/** Eyebrow, display title and subtitle, revealed line by line. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  inverted,
  align = 'left',
  size = 'lg',
  aside,
  className = '',
}: Props) {
  const center = align === 'center'
  const line = (delay: number) => ({
    initial: { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.6 },
    transition: { duration: 1.1, ease: easeOutExpo, delay },
  })

  return (
    <div className={`${center ? 'mx-auto text-center' : ''} ${className}`}>
      {(eyebrow || aside) && (
        <motion.div {...line(0)} className={`mb-6 flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
          {eyebrow && (
            <span className={`eyebrow ${inverted ? 'text-cyan' : 'text-royal'}`}>{eyebrow}</span>
          )}
          {aside}
        </motion.div>
      )}
      <motion.h2
        {...line(0.06)}
        className={`display text-balance ${inverted ? 'text-white' : 'text-ink'} ${
          size === 'xl'
            ? 'text-[clamp(2.6rem,5.6vw,5rem)]'
            : size === 'md'
              ? 'text-[clamp(1.9rem,3.1vw,2.9rem)]'
              : 'text-[clamp(2.1rem,4.2vw,3.6rem)]'
        } ${center ? 'mx-auto max-w-[18ch]' : size === 'md' ? 'max-w-[30ch]' : 'max-w-[22ch]'}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          {...line(0.14)}
          className={`mt-6 text-pretty text-[clamp(1.05rem,1.4vw,1.3rem)] leading-relaxed ${
            inverted ? 'text-white/70' : 'text-ink-soft'
          } ${center ? 'mx-auto max-w-[56ch]' : 'max-w-[60ch]'}`}
        >
          <RichText text={subtitle} />
        </motion.p>
      )}
    </div>
  )
}
