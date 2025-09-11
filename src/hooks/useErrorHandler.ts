import { useCallback } from 'react'

/**
 * Custom hook to handle async errors and route them to ErrorBoundary
 * Usage: const throwError = useErrorHandler()
 * Then: throwError(error) in catch blocks
 */
export function useErrorHandler() {
  return useCallback((error: Error) => {
    // This will be caught by ErrorBoundary
    setTimeout(() => {
      throw error
    }, 0)
  }, [])
}

/**
 * Higher-order function to wrap async functions with error handling
 */
export function withAsyncErrorHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      // Route to ErrorBoundary by throwing in next tick
      setTimeout(() => {
        throw error instanceof Error ? error : new Error(String(error))
      }, 0)
      throw error // Re-throw for local handling too
    }
  }
}

/**
 * Wrapper for event handlers that should be caught by ErrorBoundary
 */
export function withErrorBoundary<T extends unknown[]>(
  fn: (...args: T) => void | Promise<void>
) {
  return async (...args: T) => {
    try {
      await fn(...args)
    } catch (error) {
      console.error('🚨 Event handler error:', error)
      // Route to ErrorBoundary
      setTimeout(() => {
        throw error instanceof Error ? error : new Error(String(error))
      }, 0)
    }
  }
}

/**
 * Global error handler setup - call this once at app startup
 */
export function setupGlobalErrorHandling() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason)
    
    // In development, let the error show
    if (process.env.NODE_ENV === 'development') {
      console.error('🔧 DEV: This should be handled properly in components')
    }
  })

  // Catch global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('🚨 Global JavaScript Error:', event.error)
    
    // In development, preserve original behavior
    if (process.env.NODE_ENV === 'development') {
      console.error('🔧 DEV: Check your component error handling')
    }
  })
}
