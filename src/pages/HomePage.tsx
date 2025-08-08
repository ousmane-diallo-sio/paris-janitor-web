import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function HomePage() {
  const { user } = useAuthStore()

  const getDashboardPath = () => {
    if (!user) return '/auth'
    return `/dashboard/${user.role?.replace('_', '-')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header avec design moderne */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none rounded-lg transition-all duration-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm">
              PJ
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Paris Janitor
            </h1>
          </Link>
          <nav className="flex items-center space-x-4">
            {user ? (
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200">
                <Link to={getDashboardPath()}>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200">
                <Link to="/auth">Se connecter</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10" />
        <div className="container relative px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full border bg-white/60 px-3 py-1 text-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              Plateforme en ligne depuis 2025
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Gestion locative{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                simplifiée
              </span>{' '}
              en France
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
              Connectez propriétaires, voyageurs et prestataires pour une expérience locative 
              optimale partout en France
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none transition-all duration-200">
                <Link to="/auth">Commencer gratuitement</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-300 hover:bg-gray-50 px-8 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none transition-all duration-200"
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) {
                    element.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                }}
              >
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              Une solution complète pour tous
            </h2>
            <p className="mt-6 text-base text-gray-600 sm:text-lg">
              Que vous soyez propriétaire, voyageur ou prestataire, notre plateforme 
              s'adapte à vos besoins spécifiques
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Propriétaires Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-1">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
              <CardHeader className="relative pb-4">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold">Propriétaires</CardTitle>
                <CardDescription className="text-sm text-gray-600 leading-relaxed">
                  Gérez vos biens et maximisez vos revenus locatifs
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-0">
                <ul className="space-y-2.5">
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Gestion automatisée des réservations</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Services de ménage coordonnés</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Analytics et reporting avancés</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed font-medium">Commission de seulement 20%</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Voyageurs Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
              <CardHeader className="relative pb-4">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold">Voyageurs</CardTitle>
                <CardDescription className="text-sm text-gray-600 leading-relaxed">
                  Trouvez et réservez le logement parfait
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-0">
                <ul className="space-y-2.5">
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Recherche intelligente par région</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Réservation instantanée sécurisée</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Support client 24h/24, 7j/7</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed font-medium">Logements vérifiés et notés</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Prestataires Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
              <CardHeader className="relative pb-4">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-semibold">Prestataires</CardTitle>
                <CardDescription className="text-sm text-gray-600 leading-relaxed">
                  Proposez vos services de ménage et maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-0">
                <ul className="space-y-2.5">
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed font-medium">Abonnement simple à 100€/mois</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Missions régulières garanties</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Paiements automatisés sécurisés</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 leading-relaxed">Couverture géographique nationale</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Pourquoi choisir Paris Janitor ?</h2>
            <p className="text-gray-300">Une plateforme pensée pour simplifier la gestion locative française</p>
          </div>
          <div className="grid gap-8 md:grid-cols-4 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">20%</div>
              <div className="text-sm text-gray-300 uppercase tracking-wide">Commission seulement</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">24h/7j</div>
              <div className="text-sm text-gray-300 uppercase tracking-wide">Support client</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">100€</div>
              <div className="text-sm text-gray-300 uppercase tracking-wide">Abonnement mensuel</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">2025</div>
              <div className="text-sm text-gray-300 uppercase tracking-wide">Lancement plateforme</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm">
                PJ
              </div>
              <span className="text-xl font-bold text-gray-900">Paris Janitor</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 Paris Janitor. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
