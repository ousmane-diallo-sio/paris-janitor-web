import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TravelerDashboard() {
  const { user, signOut } = useAuthStore()

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
              <Button variant="outline" onClick={signOut}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recherche de logements</CardTitle>
              <CardDescription>
                Trouvez le logement parfait pour votre séjour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Rechercher des logements
              </Button>
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

          <Card>
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
              <CardDescription>
                Modifiez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Modifier le profil
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
