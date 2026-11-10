import { exampleSlide as c } from '../content/example'
import { Build } from '../deck/Build'
import { SlideFrame } from '../deck/SlideFrame'
import { RichText } from '../components/ui/RichText'

/**
 * Example content slide.
 * Builds: 0 title · 1–3 each card (registered with steps: 4 in slides.tsx).
 */
export function ExampleSlide() {
  return (
    <SlideFrame title={<RichText text={c.title} accentClass="text-royal" />} subtitle={c.subtitle}>
      <div className="grid grid-cols-3 gap-6">
        {c.cards.map((card, i) => (
          <Build key={card.title} at={i + 1} y={30} className="h-full">
            <article className="card h-full p-8">
              <h3 className="display text-[30px] leading-tight text-navy-900">{card.title}</h3>
              <p className="mt-4 text-[20px] leading-snug text-ink-soft">
                <RichText text={card.detail} />
              </p>
            </article>
          </Build>
        ))}
      </div>
    </SlideFrame>
  )
}
