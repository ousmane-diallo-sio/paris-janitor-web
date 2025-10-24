import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface ScrollToTopProps {
  behavior?: 'smooth' | 'instant'
  preserveScrollOn?: string[]
}

export function ScrollToTop({ 
  behavior = 'smooth', 
  preserveScrollOn = [] 
}: ScrollToTopProps = {}) {
  const { pathname } = useLocation()

  useEffect(() => {
    const shouldPreserveScroll = preserveScrollOn.some(route => 
      pathname.startsWith(route)
    )

    if (!shouldPreserveScroll) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: behavior
        })
      }, 0)

      return () => clearTimeout(timeoutId)
    }
  }, [pathname, behavior, preserveScrollOn])

  return null
}