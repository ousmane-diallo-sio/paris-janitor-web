import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ServiceProviderDashboard() {
  const { user, signOut } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Prestataire</h1>
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
              <CardTitle>Interventions</CardTitle>
              <CardDescription>Missions ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                0 en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Note moyenne</CardTitle>
              <CardDescription>Évaluation clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-/5</div>
              <p className="text-xs text-muted-foreground">
                Aucune évaluation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut abonnement</CardTitle>
              <CardDescription>100€/mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Actif</div>
              <p className="text-xs text-muted-foreground">
                Renouvelé le 01/01/2024
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Mes services</CardTitle>
              <CardDescription>
                Gérez vos offres de services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  Ajouter un service
                </Button>
                <Button variant="outline" className="w-full">
                  Voir mes services
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disponibilités</CardTitle>
              <CardDescription>
                Gérez votre planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  Modifier mes créneaux
                </Button>
                <Button variant="outline" className="w-full">
                  Voir le planning
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de service</CardTitle>
              <CardDescription>
                Nouvelles demandes d'intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Aucune demande en attente
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Historique des interventions</CardTitle>
              <CardDescription>
                Vos dernières missions accomplies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Aucune intervention terminée
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
