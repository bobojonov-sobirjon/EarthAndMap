function Ico({ children, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

export function IcoCalendar(props) {
  return (
    <Ico {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </Ico>
  )
}

export function IcoClock(props) {
  return (
    <Ico {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Ico>
  )
}

export function IcoCheck(props) {
  return (
    <Ico {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5 11 15.5 16.5 9" />
    </Ico>
  )
}

export function IcoPulse(props) {
  return (
    <Ico {...props}>
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </Ico>
  )
}

export function IcoLayers(props) {
  return (
    <Ico {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 12l9 5 9-5M3 16l9 5 9-5" />
    </Ico>
  )
}

export function IcoArea(props) {
  return (
    <Ico {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 14h16M10 4v16" />
    </Ico>
  )
}

export function IcoRoad(props) {
  return (
    <Ico {...props}>
      <path d="M9 3 6 21M15 3l3 18M12 7v2M12 13v2M12 19v1" />
    </Ico>
  )
}

export function IcoWater(props) {
  return (
    <Ico {...props}>
      <path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11Z" />
    </Ico>
  )
}

export function IcoPark(props) {
  return (
    <Ico {...props}>
      <path d="M12 21V11" />
      <path d="M12 11c-4 0-7-2.5-7-5.5C5 8 8 11 12 11c4 0 7-3 7-5.5C19 8.5 16 11 12 11Z" />
      <path d="M8 21h8" />
    </Ico>
  )
}

export function IcoCemetery(props) {
  return (
    <Ico {...props}>
      <path d="M10 21V8a2 2 0 0 1 4 0v13" />
      <path d="M7 21h10M8 12h8" />
    </Ico>
  )
}

export function IcoCity(props) {
  return (
    <Ico {...props}>
      <path d="M4 21V9l6-4 6 4v12" />
      <path d="M16 21V11h4v10" />
      <path d="M8 13h2M8 17h2M14 13h2M14 17h2" />
    </Ico>
  )
}

export function IcoMahalla(props) {
  return (
    <Ico {...props}>
      <path d="M3 21V10l9-6 9 6v11" />
      <path d="M9 21v-6h6v6" />
    </Ico>
  )
}

export function IcoPercent(props) {
  return (
    <Ico {...props}>
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
      <path d="M6 18 18 6" />
    </Ico>
  )
}

export function IcoMap(props) {
  return (
    <Ico {...props}>
      <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z" />
      <path d="M9 4v13M15 6.5v13" />
    </Ico>
  )
}

export function IcoChart(props) {
  return (
    <Ico {...props}>
      <path d="M4 19h16" />
      <path d="M7 16V9M12 16V5M17 16v-6" />
    </Ico>
  )
}

export function IcoMonitor(props) {
  return (
    <Ico {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Ico>
  )
}

export function IcoUrban(props) {
  return (
    <Ico {...props}>
      <path d="M4 21V10h5v11M9 21V6h6v15M15 21V13h5v8" />
    </Ico>
  )
}

export function IcoReport(props) {
  return (
    <Ico {...props}>
      <path d="M7 3h8l5 5v13H7V3Z" />
      <path d="M15 3v5h5M10 13h6M10 17h4" />
    </Ico>
  )
}

export function IcoDatabase(props) {
  return (
    <Ico {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </Ico>
  )
}

export function IcoCloud(props) {
  return (
    <Ico {...props}>
      <path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5-1.5A3.5 3.5 0 0 0 7 18Z" />
    </Ico>
  )
}

export function IcoArrow(props) {
  return (
    <Ico {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Ico>
  )
}

export function IcoDot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  )
}
