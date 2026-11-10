/** Simplified Tableau "plus" mark, drawn in currentColor. */
export function TableauMark({ className = '', size = 22 }: { className?: string; size?: number }) {
  const cross = (cx: number, cy: number, r: number, w: number) => (
    <g key={`${cx}-${cy}`} strokeWidth={w}>
      <path d={`M${cx} ${cy - r}V${cy + r}M${cx - r} ${cy}H${cx + r}`} />
    </g>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeLinecap="butt" aria-hidden>
      {cross(20, 20, 7.5, 3.4)}
      {cross(20, 5.5, 4.5, 2.2)}
      {cross(20, 34.5, 4.5, 2.2)}
      {cross(5.5, 20, 4.5, 2.2)}
      {cross(34.5, 20, 4.5, 2.2)}
      {cross(9, 9, 3, 1.6)}
      {cross(31, 9, 3, 1.6)}
      {cross(9, 31, 3, 1.6)}
      {cross(31, 31, 3, 1.6)}
    </svg>
  )
}
