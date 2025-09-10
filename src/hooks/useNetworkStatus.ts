import { useState, useEffect } from 'react'
import { networkUtils } from '@/lib/error-handling'

/**
 * Hook for monitoring network connectivity
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(networkUtils.isOnline())
  const [connectionInfo, setConnectionInfo] = useState(networkUtils.getConnectionInfo())

  useEffect(() => {
    const cleanup = networkUtils.onConnectivityChange(setIsOnline)
    
    // Update connection info periodically
    const interval = setInterval(() => {
      setConnectionInfo(networkUtils.getConnectionInfo())
    }, 10000) // Every 10 seconds

    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [])

  return {
    isOnline,
    connectionInfo,
    checkConnectivity: networkUtils.checkConnectivity,
  }
}
