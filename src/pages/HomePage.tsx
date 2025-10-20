import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { ErrorBoundaryTest } from '@/components/ErrorBoundaryTest'

export function HomePage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message)
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }, [location.state])

  const getDashboardPath = () => {
    if (!user) return '/auth'
    return `/dashboard/${user.role?.replace('_', '-')}`
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center space-x-3 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none rounded-xl transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white font-bold">
              PJ
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Paris Janitor
            </h1>
          </Link>
          <nav className="flex items-center space-x-4">
            <Button asChild variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50">
              <Link to="/services">Services</Link>
            </Button>
            {user ? (
              <Button asChild className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fc3f1] hover:to-[#1e5bef] text-white rounded-xl font-medium transition-all duration-200">
                <Link to={getDashboardPath()}>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fc3f1] hover:to-[#1e5bef] text-white rounded-xl font-medium transition-all duration-200">
                <Link to="/auth">Se connecter</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-green-700 text-center">{successMessage}</p>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden bg-gradient-to-r from-[#62cff4] to-[#2c67f2]">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm text-white">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-400"></span>
              Plateforme en ligne depuis 2025
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Gestion locative{' '}
              <span className="text-white/90">
                simplifiée
              </span>{' '}
              en France
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/90 sm:text-xl">
              Connectez propriétaires, voyageurs et prestataires pour une expérience locative 
              optimale partout en France
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90 rounded-xl px-8 py-4 font-semibold transition-all duration-200">
                <Link to="/auth">Commencer gratuitement</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-gray-600 hover:bg-white/10 rounded-xl px-8 py-4 font-medium transition-all duration-200"
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

      <section id="features" className="py-24 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl mb-6">
              Une solution complète pour tous
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Que vous soyez propriétaire, voyageur ou prestataire, notre plateforme 
              s'adapte à vos besoins spécifiques
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="rounded-2xl bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <CardHeader className="pb-6 pt-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Propriétaires</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Gérez vos biens et maximisez vos revenus locatifs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Gestion automatisée des réservations</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Services de ménage coordonnés</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Analytics et reporting avancés</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-semibold">Commission de seulement 20%</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#62cff4] to-[#2c67f2]"></div>
              <CardHeader className="pb-6 pt-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Voyageurs</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Trouvez et réservez le logement parfait
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">Recherche intelligente par région</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">Réservation instantanée sécurisée</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">Support client 24h/24, 7j/7</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-gray-700 font-semibold">Logements vérifiés et notés</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600"></div>
              <CardHeader className="pb-6 pt-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Prestataires</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Proposez vos services de ménage et maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-gray-700 font-semibold">Abonnement simple à 100€/mois</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-gray-700">Missions régulières garanties</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-gray-700">Paiements automatisés sécurisés</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-gray-700">Couverture géographique nationale</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-6">Pourquoi choisir Paris Janitor ?</h2>
            <p className="text-gray-300 text-lg">Une plateforme pensée pour simplifier la gestion locative française</p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm">
              <div className="text-5xl font-bold text-white mb-2">20%</div>
              <div className="text-gray-300 uppercase tracking-wide">Commission seulement</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm">
              <div className="text-5xl font-bold text-white mb-2">24h/7j</div>
              <div className="text-gray-300 uppercase tracking-wide">Support client</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm">
              <div className="text-5xl font-bold text-white mb-2">100€</div>
              <div className="text-gray-300 uppercase tracking-wide">Abonnement mensuel</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm">
              <div className="text-5xl font-bold text-white mb-2">2025</div>
              <div className="text-gray-300 uppercase tracking-wide">Lancement plateforme</div>
            </div>
          </div>
        </div>
      </section>

      {process.env.NODE_ENV === 'development' && (
        <section className="py-8 bg-orange-50 border-t-2 border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-orange-800">Development Tools</h3>
              <p className="text-sm text-orange-600">These controls are only visible in development mode</p>
            </div>
            <ErrorBoundaryTest />
          </div>
        </section>
      )}

      <footer className="bg-white border-t py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white font-bold">
                PJ
              </div>
              <span className="text-2xl font-bold text-gray-900">Paris Janitor</span>
            </div>
            <div className="text-gray-500">
              © 2025 Paris Janitor. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
