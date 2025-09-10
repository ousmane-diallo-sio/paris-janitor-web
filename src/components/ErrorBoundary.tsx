import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { ERROR_BOUNDARY_MESSAGES, logError } from '@/lib/error-handling'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    logError(error, 'ErrorBoundary')
    console.error('Error Boundary caught an error:', error, errorInfo)

    this.props.onError?.(error, errorInfo)

    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo)
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Production Error Report:', {
      error: error.toString(),
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }

  private getErrorType = (): keyof typeof ERROR_BOUNDARY_MESSAGES => {
    const error = this.state.error
    if (!error) return 'generic'

    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection')) {
      return 'network'
    }

    if (errorMessage.includes('auth') || 
        errorMessage.includes('session') ||
        errorMessage.includes('unauthorized')) {
      return 'auth'
    }

    return 'generic'
  }

  private handleRetry = () => {
    const maxRetries = 3
    if (this.state.retryCount >= maxRetries) {
      this.handleReload()
      return
    }

    this.setState(prevState => ({ 
      retryCount: prevState.retryCount + 1
    }))

    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      })
    }, 1000)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.getErrorType()
      const errorConfig = ERROR_BOUNDARY_MESSAGES[errorType]
      const { retryCount } = this.state

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {errorConfig.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                {errorConfig.description}
              </p>

              {retryCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 text-center">
                    Tentative {retryCount}/{3} échouée
                    {retryCount >= 3 && ' - Rechargement de la page recommandé'}
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                    Détails de l'erreur (développement)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <p className="text-red-600 font-semibold mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-gray-700 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  disabled={retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {retryCount >= 3 ? 'Trop de tentatives' : errorConfig.action}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recharger la page
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={this.handleGoHome}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
