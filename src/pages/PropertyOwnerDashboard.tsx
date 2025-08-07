import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PropertyOwnerDashboard() {
  const { user, signOut } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Propriétaire</h1>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenus du mois</CardTitle>
              <CardDescription>Total des gains générés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 €</div>
              <p className="text-xs text-muted-foreground">
                +0% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réservations</CardTitle>
              <CardDescription>Réservations actives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                0 nouvelles ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taux d'occupation</CardTitle>
              <CardDescription>Moyenne sur 30 jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Optimisation possible
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propriétés</CardTitle>
              <CardDescription>Nombre total de biens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Ajoutez votre premier bien
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Mes propriétés</CardTitle>
              <CardDescription>
                Gérez vos biens immobiliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  Ajouter une propriété
                </Button>
                <Button variant="outline" className="w-full">
                  Voir toutes mes propriétés
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services de ménage</CardTitle>
              <CardDescription>
                Planifiez et gérez les interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  Planifier un ménage
                </Button>
                <Button variant="outline" className="w-full">
                  Historique des services
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Réservations récentes</CardTitle>
              <CardDescription>
                Dernières réservations de vos propriétés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Aucune réservation pour le moment
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
