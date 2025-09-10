import { toast } from 'sonner'

/**
 * Comprehensive error handler for the application
 * Provides user-friendly error messages and appropriate actions
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  const message = error instanceof Error ? error.message : ''
  const errorString = String(error).toLowerCase()

  if (message.includes('Invalid login credentials') || 
      message.includes('email not confirmed') ||
      errorString.includes('invalid_grant') ||
      errorString.includes('401')) {
    return '🔐 Identifiants incorrects - Vérifiez votre email et mot de passe'
  }

  if (message.includes('User already registered')) {
    return '📧 Cet email est déjà utilisé - Essayez de vous connecter ou utilisez un autre email'
  }

  if (message.includes('Password should be at least')) {
    return '🔒 Le mot de passe doit contenir au moins 6 caractères'
  }

  if (message.includes('Unable to validate email address')) {
    return '📧 Format d\'email invalide - Vérifiez votre adresse email'
  }

  if (message.includes('Email rate limit exceeded')) {
    return '⏱️ Trop de tentatives - Attendez quelques minutes avant de réessayer'
  }

  if (
    // Fetch/Network errors
    message.includes('fetch') || 
    message.includes('NetworkError') ||
    message.includes('Failed to fetch') ||
    message.includes('NETWORK_ERROR') ||
    message.includes('ERR_NETWORK') ||
    message.includes('ERR_INTERNET_DISCONNECTED') ||
    message.includes('ERR_NETWORK_CHANGED') ||
    
    // Connection errors
    errorString.includes('network') ||
    errorString.includes('connection') ||
    errorString.includes('connexion') ||
    errorString.includes('offline') ||
    errorString.includes('no internet') ||
    errorString.includes('wifi') ||
    
    // Timeout errors
    message.includes('timeout') ||
    message.includes('TIMEOUT') ||
    message.includes('Request timeout') ||
    message.includes('Connection timeout') ||
    errorString.includes('timeout') ||
    
    // Browser specific network errors
    message.includes('ERR_NAME_NOT_RESOLVED') ||
    message.includes('ERR_CONNECTION_REFUSED') ||
    message.includes('ERR_CONNECTION_RESET') ||
    message.includes('ERR_CONNECTION_ABORTED') ||
    message.includes('ERR_CONNECTION_TIMED_OUT') ||
    
    // Mobile/weak connection indicators
    message.includes('Request failed with status code 0') ||
    message.includes('Network request failed') ||
    errorString.includes('cors') && errorString.includes('network')
  ) {
    if (
      message.includes('ERR_INTERNET_DISCONNECTED') ||
      message.includes('ERR_NETWORK_CHANGED') ||
      errorString.includes('offline') ||
      errorString.includes('no internet') ||
      errorString.includes('wifi')
    ) {
      return '📶 Pas de connexion internet - Vérifiez votre WiFi ou données mobiles'
    }
    
    if (
      message.includes('timeout') ||
      message.includes('TIMEOUT') ||
      errorString.includes('timeout')
    ) {
      return '⏰ Connexion trop lente - Vérifiez votre réseau et réessayez'
    }
    
    return '🌐 Problème de connexion - Vérifiez votre internet et réessayez'
  }

  if (message.includes('permission denied') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      errorString.includes('403')) {
    return '🚫 Accès refusé - Vous n\'avez pas les permissions nécessaires'
  }

  if (message.includes('500') || message.includes('Internal Server Error')) {
    return '🔧 Erreur serveur temporaire - Notre équipe technique est informée'
  }

  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return '⚠️ Ces données existent déjà - Vérifiez vos informations'
  }

  if (message.includes('foreign key constraint')) {
    return '🔗 Impossible de supprimer - Des éléments dépendent de cette donnée'
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return '📝 Données invalides - Vérifiez les champs requis'
  }

  if (message.includes('file') && (message.includes('too large') || message.includes('size'))) {
    return '📁 Fichier trop volumineux - Maximum 5 Mo autorisé'
  }

  if (message.includes('file type not supported')) {
    return '📄 Format de fichier non supporté - Utilisez JPG, PNG ou PDF'
  }

  return message || '❌ Une erreur inattendue s\'est produite - Réessayez dans quelques instants'
}

/**
 * Enhanced toast notification system with context-aware messaging
 */
export const notify = {
  /**
   * Success notification
   */
  success: (message: string, action?: { label: string; onClick: () => void }) => {
    toast.success(message, {
      duration: 4000,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    })
  },

  /**
   * Error notification with user-friendly message
   */
  error: (error: unknown, action?: { label: string; onClick: () => void }) => {
    const message = getErrorMessage(error)
    toast.error(message, {
      duration: 6000, // Longer duration for errors
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    })
  },

  /**
   * Warning notification
   */
  warning: (message: string) => {
    toast.warning(message, {
      duration: 5000,
    })
  },

  /**
   * Info notification
   */
  info: (message: string) => {
    toast.info(message, {
      duration: 3000,
    })
  },

  /**
   * Loading notification that can be updated
   */
  loading: (message: string) => {
    return toast.loading(message)
  },

  /**
   * Promise-based notification for async operations
   */
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error: (err) => {
        const errorMessage = typeof error === 'function' ? error(err) : error
        return getErrorMessage(errorMessage)
      },
    })
  },
}

/**
 * Async operation wrapper with proper error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options?: {
    loadingMessage?: string
    successMessage?: string | ((data: T) => string)
    errorMessage?: string
    showLoading?: boolean
  }
): Promise<{ data: T | null; error: unknown }> {
  const {
    loadingMessage = 'Opération en cours...',
    successMessage,
    errorMessage,
    showLoading = false,
  } = options || {}

  let toastId: string | number | undefined

  try {
    if (showLoading) {
      toastId = notify.loading(loadingMessage)
    }

    const data = await operation()

    if (toastId) {
      toast.dismiss(toastId)
    }

    if (successMessage) {
      const message = typeof successMessage === 'function' ? successMessage(data) : successMessage
      notify.success(message)
    }

    return { data, error: null }
  } catch (error) {
    if (toastId) {
      toast.dismiss(toastId)
    }

    console.error('Async operation failed:', error)

    if (errorMessage) {
      notify.error(errorMessage)
    } else {
      notify.error(error)
    }

    return { data: null, error }
  }
}

/**
 * Error boundary fallback component data
 */
export const ERROR_BOUNDARY_MESSAGES = {
  generic: {
    title: 'Une erreur inattendue s\'est produite',
    description: 'L\'application a rencontré un problème. Veuillez rafraîchir la page.',
    action: 'Rafraîchir la page',
  },
  network: {
    title: 'Problème de connexion',
    description: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    action: 'Réessayer',
  },
  auth: {
    title: 'Session expirée',
    description: 'Votre session a expiré. Veuillez vous reconnecter.',
    action: 'Se reconnecter',
  },
}

/**
 * Development-only error logging
 */
export function logError(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error ${context ? `in ${context}` : ''}`)
    console.error('Error details:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    console.groupEnd()
  }
}

/**
 * Network connectivity utilities
 */
export const networkUtils = {
  /**
   * Check if the browser is online
   */
  isOnline: () => {
    return navigator.onLine
  },

  /**
   * Check network connectivity with a ping to a reliable endpoint
   */
  checkConnectivity: async (timeout = 5000): Promise<boolean> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return true
    } catch {
      return false
    }
  },

  /**
   * Monitor network connectivity changes
   */
  onConnectivityChange: (callback: (isOnline: boolean) => void) => {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  },

  /**
   * Detect connection type (if supported)
   */
  getConnectionInfo: () => {
    // @ts-expect-error - navigator.connection is not in TS types but exists in modern browsers
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink, // bandwidth in Mbps
        rtt: connection.rtt, // round-trip time in ms
        saveData: connection.saveData, // user has data saver on
      }
    }
    
    return null
  }
}

/**
 * Enhanced async operation wrapper with network awareness
 */
export async function handleAsyncOperationWithNetworkCheck<T>(
  operation: () => Promise<T>,
  options?: {
    loadingMessage?: string
    successMessage?: string | ((data: T) => string)
    showLoading?: boolean
    checkConnectivity?: boolean
  }
): Promise<{ data: T | null; error: unknown }> {
  const {
    loadingMessage = 'Opération en cours...',
    successMessage,
    showLoading = false,
    checkConnectivity = true,
  } = options || {}

  if (checkConnectivity && !networkUtils.isOnline()) {
    const error = new Error('No internet connection')
    notify.error('📶 Pas de connexion internet - Vérifiez votre WiFi ou données mobiles', {
      label: 'Réessayer',
      onClick: () => handleAsyncOperationWithNetworkCheck(operation, options)
    })
    return { data: null, error }
  }

  let toastId: string | number | undefined

  try {
    if (showLoading) {
      toastId = notify.loading(loadingMessage)
    }

    const data = await operation()

    if (toastId) {
      toast.dismiss(toastId)
    }

    if (successMessage) {
      const message = typeof successMessage === 'function' ? successMessage(data) : successMessage
      notify.success(message)
    }

    return { data, error: null }
  } catch (error) {
    if (toastId) {
      toast.dismiss(toastId)
    }

    console.error('Async operation failed:', error)

    const errorMessage = getErrorMessage(error)
    if (errorMessage.includes('connexion') || errorMessage.includes('internet') || errorMessage.includes('réseau')) {
      notify.error(error, {
        label: 'Vérifier la connexion',
        onClick: async () => {
          const isConnected = await networkUtils.checkConnectivity()
          if (isConnected) {
            notify.info('✅ Connexion rétablie - Vous pouvez réessayer')
          } else {
            notify.warning('❌ Toujours pas de connexion - Vérifiez votre WiFi')
          }
        }
      })
    } else if (errorMessage) {
      notify.error(errorMessage)
    } else {
      notify.error(error)
    }

    return { data: null, error }
  }
}
