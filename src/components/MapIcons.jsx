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

export function IconRoute() {
  return (
    <Icon>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8 16.5c2.2-1 3.4-3.2 5.8-8.2.6-1.2 1.5-2 2.6-2.3" />
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

export function IconEye({ size = 18 }) {
  return (
    <Icon size={size}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}

export function IconPencil({ size = 18 }) {
  return (
    <Icon size={size}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
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

export function IconHeat() {
  return (
    <Icon>
      <path d="M12 3c2 3 5 5 5 9a5 5 0 1 1-10 0c0-4 3-6 5-9Z" />
    </Icon>
  )
}

export function IconSplit() {
  return (
    <Icon>
      <rect x="3" y="4" width="8" height="16" rx="1.5" />
      <rect x="13" y="4" width="8" height="16" rx="1.5" />
    </Icon>
  )
}

export function IconTimeline() {
  return (
    <Icon>
      <path d="M4 12h16" />
      <circle cx="7" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="17" cy="12" r="2.2" />
    </Icon>
  )
}
