import { useCallback, useEffect, useRef, useState } from 'react'

/** Intro davomiyligi (ms) — CSS animatsiya bilan mos */
export const INTRO_MS = 7200

const LAYERS = [
  { name: "Yo'llar", color: '#f97316' },
  { name: "Sug'orish", color: '#38bdf8' },
  { name: "Bog'lar", color: '#22c55e' },
  { name: 'Qabristonlar', color: '#94a3b8' },
]

function introQuery() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('intro')
}

/** Har sahifa yangilanganda (F5 / Ctrl+Shift+R) ko‘rsatiladi. ?intro=0 — o‘tkazish. */
export function shouldShowIntro() {
  if (typeof window === 'undefined') return false
  const q = introQuery()
  if (q === '0' || q === '-1') return false
  return true
}

export default function IntroSplash({ onDone }) {
  const doneRef = useRef(false)
  const [leaving, setLeaving] = useState(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setLeaving(true)
    window.setTimeout(() => onDone?.(), 680)
  }, [onDone])

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = window.setTimeout(finish, reduced ? 400 : INTRO_MS)
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [finish])

  return (
    <div className={`intro-splash intro-v2 ${leaving ? 'is-leaving' : ''}`} role="dialog" aria-label="Buxoro GIS kirish">
      <div className="intro-v2__terrain" aria-hidden />
      <div className="intro-v2__vignette" aria-hidden />

      <svg className="intro-v2__map" viewBox="0 0 800 500" aria-hidden>
        <defs>
          <linearGradient id="parkFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14532d" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path className="intro-draw intro-draw--bound" d="M90 80h620v340H90z" />
        <path className="intro-draw intro-draw--road" d="M90 250 H710 M220 80 V420 M400 80 V420 M560 80 V420 M90 160 H710 M90 340 H710" />
        <path className="intro-draw intro-draw--road2" d="M140 420 C 220 300, 360 280, 480 210 S 640 90, 710 120" />
        <path className="intro-draw intro-draw--water" d="M120 390 C 200 360, 280 400, 360 370 S 520 300, 680 330" />
        <path className="intro-fill intro-fill--park" d="M250 175h90v70H250z" />
        <path className="intro-fill intro-fill--park" d="M470 280h110v55H470z" />
        <path className="intro-fill intro-fill--cem" d="M610 175h70v48H610z" />
        <circle className="intro-node" cx="400" cy="250" r="5" />
        <circle className="intro-node" cx="220" cy="160" r="4" />
        <circle className="intro-node" cx="560" cy="340" r="4" />
        <circle className="intro-node" cx="480" cy="210" r="4" />
      </svg>

      <div className="intro-v2__cross" aria-hidden>
        <i /><i /><i /><i />
        <b />
      </div>

      <div className="intro-v2__layers">
        {LAYERS.map((l, i) => (
          <span key={l.name} style={{ '--c': l.color, '--i': i }}>
            <i /> {l.name}
          </span>
        ))}
      </div>

      <div className="intro-v2__title">
        <p>Buxoro shahri</p>
        <h1>Buxoro <em>GIS</em></h1>
        <small>Elektron reyestr va monitoring</small>
      </div>

      <button type="button" className="intro-skip" onClick={finish}>O‘tkazib yuborish</button>
      <div className="intro-bar" aria-hidden><i /></div>
    </div>
  )
}
