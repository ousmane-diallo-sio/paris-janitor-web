import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useErrorHandler } from '@/hooks/useErrorHandler'

/**
 * Test component to verify ErrorBoundary functionality
 * Remove this in production - it's only for testing error handling
 */
export function ErrorBoundaryTest() {
  const [count, setCount] = useState(0)
  const throwError = useErrorHandler()

  // Test 1: Synchronous error in render
  if (count === 5) {
    throw new Error('🧪 TEST: Synchronous render error at count 5')
  }

  // Test 2: Error in event handler
  const handleAsyncError = async () => {
    try {
      await new Promise((_, reject) => 
        setTimeout(() => reject(new Error('🧪 TEST: Async error in event handler')), 1000)
      )
    } catch (error) {
      throwError(error as Error)
    }
  }

  // Test 3: Direct throw in event handler
  const handleDirectError = () => {
    throw new Error('🧪 TEST: Direct error in click handler')
  }

  // Test 4: Promise rejection
  const handlePromiseRejection = () => {
    Promise.reject(new Error('🧪 TEST: Unhandled promise rejection'))
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8 border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="text-orange-800">🧪 ErrorBoundary Tests</CardTitle>
        <p className="text-sm text-orange-600">
          Use these buttons to test error handling (DEV ONLY)
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Count: <span className="font-bold">{count}</span> 
            {count >= 4 && <span className="text-red-600 ml-2">⚠️ Next click triggers render error!</span>}
          </p>
          <Button 
            onClick={() => setCount(c => c + 1)}
            variant="outline"
            size="sm"
          >
            Increment (Error at 5)
          </Button>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleAsyncError}
            variant="destructive" 
            size="sm"
            className="w-full"
          >
            Test Async Error
          </Button>
          
          <Button 
            onClick={handleDirectError}
            variant="destructive" 
            size="sm"
            className="w-full"
          >
            Test Direct Error
          </Button>
          
          <Button 
            onClick={handlePromiseRejection}
            variant="destructive" 
            size="sm"
            className="w-full"
          >
            Test Promise Rejection
          </Button>

          <Button 
            onClick={() => {
              setCount(0)
              console.clear()
            }}
            variant="secondary" 
            size="sm"
            className="w-full"
          >
            Reset & Clear Console
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Check console and ErrorBoundary behavior for each test
        </p>
      </CardContent>
    </Card>
  )
}
