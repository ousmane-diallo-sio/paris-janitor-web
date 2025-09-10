import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, WifiOff } from 'lucide-react'
import { networkUtils } from '@/lib/error-handling'

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(networkUtils.isOnline())
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)

  useEffect(() => {
    const cleanup = networkUtils.onConnectivityChange((online) => {
      setIsOnline(online)
      if (!online) {
        setShowOfflineAlert(true)
      } else {
        setTimeout(() => setShowOfflineAlert(false), 3000)
      }
    })

    return cleanup
  }, [])

  if (!showOfflineAlert && isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {!isOnline ? (
        <Alert className="border-red-500 bg-red-50 text-red-800">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="font-medium">
            📶 Pas de connexion internet - Vérifiez votre WiFi ou données mobiles
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500 bg-green-50 text-green-800">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="font-medium">
            ✅ Connexion rétablie
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
