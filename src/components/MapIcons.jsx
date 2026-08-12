/** Xarita asboblari uchun SVG ikonlar */

function Icon({ children, size = 18 }) {
  return (
    <svg
      className="map-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconHome() {
  return (
    <Icon>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </Icon>
  )
}

export function IconRuler() {
  return (
    <Icon>
      <path d="M4 16 16 4" />
      <path d="M7 13l1.5 1.5M10.5 9.5 12 11M14 6l1.5 1.5" />
    </Icon>
  )
}

export function IconCrosshair() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconPrint() {
  return (
    <Icon>
      <path d="M7 9V4h10v5" />
      <rect x="5" y="9" width="14" height="8" rx="1.5" />
      <path d="M7 17h10v3H7v-3Z" />
      <path d="M8 12h.01M11 12h.01" strokeWidth="2.5" />
    </Icon>
  )
}

export function IconPlus() {
  return (
    <Icon size={20}>
      <path d="M12 5v14M5 12h14" strokeWidth="2" />
    </Icon>
  )
}

export function IconMinus() {
  return (
    <Icon size={20}>
      <path d="M5 12h14" strokeWidth="2" />
    </Icon>
  )
}

export function IconLocate() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      <circle cx="12" cy="12" r="7" strokeDasharray="3 3" />
    </Icon>
  )
}

export function IconRefresh({ spinning = false }) {
  return (
    <svg
      className={`map-icon ${spinning ? 'map-icon--spin' : ''}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}
