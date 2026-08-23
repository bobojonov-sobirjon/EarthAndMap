import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import IntroSplash, { shouldShowIntro } from './IntroSplash'
import PageLoader from './PageLoader'

export function useIntroGate() {
  const { search, pathname } = useLocation()
  const [open, setOpen] = useState(() => shouldShowIntro())

  useEffect(() => {
    const p = new URLSearchParams(search).get('intro')
    if (p === '1') setOpen(true)
    if (p === '0' || p === '-1') setOpen(false)
  }, [search])

  const closeIntro = useCallback(() => setOpen(false), [])
  const hideRoute = pathname === '/login'
    || pathname === '/register'
    || pathname.startsWith('/admin-panel')
  const introOpen = hideRoute ? false : open

  return { introOpen, closeIntro }
}

export function IntroGate({ children, loading }) {
  const { introOpen, closeIntro } = useIntroGate()

  return (
    <>
      {introOpen && <IntroSplash onDone={closeIntro} />}
      {loading ? (
        <PageLoader />
      ) : (
        <div className={introOpen ? 'app-behind-intro' : 'app-enter'}>
          {children}
        </div>
      )}
    </>
  )
}
