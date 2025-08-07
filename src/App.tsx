import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { PropertyOwnerDashboard } from '@/pages/PropertyOwnerDashboard'
import { TravelerDashboard } from '@/pages/TravelerDashboard'
import { ServiceProviderDashboard } from '@/pages/ServiceProviderDashboard'
import { AuthPage } from '@/pages/AuthPage'
import { HomePage } from '@/pages/HomePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {user && (
              <>
                <Route path="/dashboard/property-owner" element={<PropertyOwnerDashboard />} />
                <Route path="/dashboard/traveler" element={<TravelerDashboard />} />
                <Route path="/dashboard/service-provider" element={<ServiceProviderDashboard />} />
              </>
            )}
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
