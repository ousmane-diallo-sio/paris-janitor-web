import { Navigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { devUtils } from '../lib/dev-utils'

export function TravelerDashboard() {
  const { user, signOut, loading } = useAuthStore()

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

  if (!loading && !user) {
    return <Navigate to="/auth" replace />
  }

  if (!loading && user && user.role !== 'traveler') {
    return <Navigate to={`/dashboard/${user.role?.replace('_', '-')}`} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Voyageur</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bonjour, {user?.full_name || user?.email}
              </span>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  Mon profil
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recherche de logements</CardTitle>
              <CardDescription>
                Trouvez le logement parfait pour votre séjour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/search">
                <Button className="w-full">
                  Rechercher des logements
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes réservations</CardTitle>
              <CardDescription>
                Gérez vos réservations en cours et passées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Voir mes réservations
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Logements recommandés</CardTitle>
              <CardDescription>
                Découvrez nos meilleures offres du moment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Aucun logement disponible pour le moment
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
