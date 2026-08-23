import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { pendingCount, subscribePending } from '../api/pending'

export default function RouteProgress() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const hideTimer = useRef(null)

  const show = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    setLeaving(false)
    setVisible(true)
  }

  const hideSoon = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (pendingCount() > 0) return
      setLeaving(true)
      hideTimer.current = setTimeout(() => {
        setVisible(false)
        setLeaving(false)
      }, 280)
    }, 180)
  }

  useEffect(() => {
    show()
    const t = setTimeout(() => {
      if (pendingCount() === 0) hideSoon()
    }, 400)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => subscribePending((n) => {
    if (n > 0) show()
    else hideSoon()
  }), [])

  if (!visible) return null
  return (
    <div className={`route-progress${leaving ? ' is-done' : ''}`} role="progressbar" aria-hidden />
  )
}
