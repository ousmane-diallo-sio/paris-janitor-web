import { useEffect } from 'react'

interface UseScrollToTopOptions {
  condition?: boolean
  behavior?: 'smooth' | 'instant'
  delay?: number
}

/**
 * Hook to scroll to top of page
 * @param options - Configuration options
 */
export function useScrollToTop({
  condition = true,
  behavior = 'smooth',
  delay = 0
}: UseScrollToTopOptions = {}) {
  
  const scrollToTop = () => {
    if (condition) {
      const executeScroll = () => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: behavior
        })
      }

      if (delay > 0) {
        setTimeout(executeScroll, delay)
      } else {
        executeScroll()
      }
    }
  }

  return { scrollToTop }
}

/**
 * Hook to automatically scroll to top on mount
 * @param options - Configuration options
 */
export function useScrollToTopOnMount(options: UseScrollToTopOptions = {}) {
  const { scrollToTop } = useScrollToTop(options)

  useEffect(() => {
    scrollToTop()
  }, [scrollToTop])
}