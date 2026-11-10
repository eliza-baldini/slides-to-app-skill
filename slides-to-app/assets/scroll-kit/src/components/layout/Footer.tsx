import { meta } from '../../content/navigation'
import { useScrollTo } from '../motion/SmoothScroll'
import { TableauMark } from '../ui/TableauMark'

export function Footer() {
  const scrollTo = useScrollTo()
  return (
    <footer data-surface="dark" className="bg-navy-950 text-white">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 py-16 sm:px-10 md:flex-row md:items-end md:justify-between">
        <div>
          <TableauMark size={28} className="text-white/80" />
          <p className="display mt-6 text-3xl">{meta.title}</p>
          <p className="mt-2 text-[14px] text-white/50">
            {meta.eyebrow} · {meta.date}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="rounded-full bg-white/10 px-5 py-2.5 text-[13px] font-medium ring-1 ring-white/15 transition hover:bg-white/20"
          >
            Back to top ↑
          </button>
          <p className="eyebrow text-white/40">{meta.confidentiality}</p>
        </div>
      </div>
    </footer>
  )
}
