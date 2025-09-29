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
import { ProfilePage } from '@/pages/ProfilePage'
import { PropertySearchPage } from '@/pages/PropertySearchPage'
import { PropertyDetailsPage } from '@/pages/PropertyDetailsPage'
import ServiceCatalogPage from '@/pages/ServiceCatalogPage'
import PrivacyPage from '@/pages/PrivacyPage'

import { Toaster } from '@/components/ui/sonner'
import ErrorBoundary from '@/components/ErrorBoundary'
import { NetworkStatusIndicator } from '@/components/NetworkStatus'
import Footer from '@/components/common/Footer'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  const { initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/search" element={<PropertySearchPage />} />
              <Route path="/property/:id" element={<PropertyDetailsPage />} />
              <Route path="/services" element={<ServiceCatalogPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              {/* Protected routes - always rendered but with internal auth checks */}
              <Route path="/dashboard/property-owner" element={<PropertyOwnerDashboard />} />
              <Route path="/dashboard/traveler" element={<TravelerDashboard />} />
              <Route path="/dashboard/service-provider" element={<ServiceProviderDashboard />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
          </div>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
        <NetworkStatusIndicator />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
