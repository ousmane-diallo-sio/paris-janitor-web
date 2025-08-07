import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AuthPage() {
  const { user, signIn, signUp, loading } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'property_owner' | 'traveler' | 'service_provider'>('traveler')
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to={`/dashboard/${user.role?.replace('_', '-')}`} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password, {
          full_name: fullName,
          phone,
          role,
        })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte Paris Janitor'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Se connecter' : 'S\'inscrire'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Entrez vos identifiants pour accéder à votre compte'
                : 'Remplissez les informations pour créer votre compte'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Type de compte</Label>
                    <Select value={role} onValueChange={(value: 'property_owner' | 'traveler' | 'service_provider') => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="traveler">Voyageur</SelectItem>
                        <SelectItem value="property_owner">Propriétaire</SelectItem>
                        <SelectItem value="service_provider">Prestataire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
              >
                {isLogin 
                  ? 'Pas de compte ? S\'inscrire'
                  : 'Déjà un compte ? Se connecter'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
