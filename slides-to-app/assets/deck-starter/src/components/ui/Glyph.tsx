/** Small line icons for cards and lists. Add paths as slides need them. */
export type GlyphName =
  | 'database'
  | 'shield'
  | 'gear'
  | 'chart'
  | 'bulb'
  | 'people'
  | 'target'
  | 'bolt'
  | 'sparkle'
  | 'layers'
  | 'chat'
  | 'compass'
  | 'arrow-up'

export function Glyph({ name, className = '', size = 20 }: { name: GlyphName; className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {name === 'database' && (
        <>
          <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
          <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
        </>
      )}
      {name === 'shield' && <path d="M12 3l7 3v5.5c0 4.6-3 7.9-7 9.5-4-1.6-7-4.9-7-9.5V6z" />}
      {name === 'gear' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
        </>
      )}
      {name === 'chart' && <path d="M5 20V11M10 20V6M15 20v-7M20 20V9M3 20h18" />}
      {name === 'bulb' && <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />}
      {name === 'people' && (
        <>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M14.5 14.6c2.6-.4 4.7 1.2 5.5 4.4" />
        </>
      )}
      {name === 'target' && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" />
        </>
      )}
      {name === 'bolt' && <path d="M13 2L4 14h7l-1 8 9-12h-7z" />}
      {name === 'sparkle' && <path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z" />}
      {name === 'layers' && <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />}
      {name === 'chat' && <path d="M4 5h16v11H9l-5 4z" />}
      {name === 'compass' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </>
      )}
      {name === 'arrow-up' && <path d="M12 20V5M6 11l6-6 6 6" />}
    </svg>
  )
}
