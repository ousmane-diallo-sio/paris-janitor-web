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

    // Always log the error
    logError(error, 'ErrorBoundary')
    console.error('🚨 ErrorBoundary caught an error:', error)
    console.error('📍 Component stack:', errorInfo.componentStack)
    
    // Force show error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🔧 DEV MODE - Full error details:', {
        error: error.toString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
    }

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
      // In development, always show our error UI with details
      const errorType = this.getErrorType()
      const errorConfig = ERROR_BOUNDARY_MESSAGES[errorType]
      const { retryCount } = this.state
      
      // Only use custom fallback in production
      if (this.props.fallback && process.env.NODE_ENV === 'production') {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="">
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
                <div className="mt-4 space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">🚨 Development Error Details</h4>
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium text-red-700">Error:</span>
                        <p className="text-red-600 font-mono text-xs mt-1 break-all">
                          {this.state.error.toString()}
                        </p>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <span className="font-medium text-red-700">Stack Trace:</span>
                          <pre className="text-red-600 font-mono text-xs mt-1 whitespace-pre-wrap overflow-auto max-h-32 bg-red-100 p-2 rounded">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {this.state.errorInfo?.componentStack && (
                    <details className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <summary className="cursor-pointer text-sm font-medium text-yellow-800 hover:text-yellow-900">
                        📍 React Component Stack (click to expand)
                      </summary>
                      <pre className="mt-2 text-yellow-700 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-32 bg-yellow-100 p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
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
