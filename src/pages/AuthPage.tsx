
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  const message = error instanceof Error ? error.message : ''
  const errorString = String(error).toLowerCase()
  if (message.includes('Invalid login credentials') || 
      message.includes('Invalid email or password') ||
      errorString.includes('invalid_grant') ||
      errorString.includes('401')) {
    return '🔐 Email ou mot de passe incorrect'
  }
  if (message.includes('Email not confirmed')) {
    return '📧 Veuillez confirmer votre email avant de vous connecter'
  }
  if (message.includes('User already registered')) {
    return '👤 Un compte existe déjà avec cet email'
  }
  if (message.includes('Password should be at least')) {
    return '🔑 Le mot de passe doit contenir au moins 6 caractères'
  }
  if (message.includes('Invalid email')) {
    return '📧 Format d\'email invalide'
  }
  if (message.includes('Signup is disabled')) {
    return '🚧 Les inscriptions sont temporairement désactivées'
  }
  if (message.includes('Email rate limit exceeded')) {
    return '⏰ Trop de tentatives. Veuillez patienter avant de réessayer'
  }
  if (message.includes('Too many requests')) {
    return '🚦 Trop de tentatives de connexion. Veuillez patienter'
  }
  if (message.includes('Failed to fetch') || 
      message.includes('NetworkError') || 
      message.includes('fetch') ||
      message.includes('ERR_NETWORK') ||
      message.includes('ERR_INTERNET_DISCONNECTED') ||
      errorString.includes('network') ||
      errorString.includes('connection') ||
      !navigator.onLine) {
    return '❌ Échec de connexion - Vérifiez votre connexion internet et réessayez'
  }
  if (message.includes('timeout') || message.includes('TIMEOUT')) {
    return '⏱️ Délai d\'attente dépassé - Le serveur met trop de temps à répondre'
  }
  if (message.includes('ECONNREFUSED') || 
      message.includes('Connection refused') ||
      message.includes('ERR_CONNECTION_REFUSED')) {
    return '🚫 Impossible de se connecter au serveur - Service temporairement indisponible'
  }
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return '🔧 Erreur serveur - Problème technique temporaire'
  }
  if (message.includes('503') || message.includes('Service Unavailable')) {
    return '⚠️ Service temporairement indisponible - Réessayez dans quelques minutes'
  }
  return message || '❓ Une erreur inattendue est survenue - Veuillez réessayer'
}

export function AuthPage() {
  const navigate = useNavigate()
  const { user, signIn, signUp, loading } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'property_owner' | 'traveler' | 'service_provider'>('traveler')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const isDevelopment = import.meta.env.DEV
  const fillDevCredentials = useCallback(() => {
    if (isLogin) {
      const testUsers = [
        { email: 'admin@parisjanitor.com', password: 'admin123' },
        { email: 'owner@test.com', password: 'owner123' },
        { email: 'traveler@test.com', password: 'travel123' },
        { email: 'service@test.com', password: 'service123' }
      ]
      const randomUser = testUsers[Math.floor(Date.now() / 1000) % testUsers.length]
      setEmail(randomUser.email)
      setPassword(randomUser.password)
    } else {
      const sampleNames = ['Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Bernard']
      const randomName = sampleNames[Math.floor(Date.now() / 1000) % sampleNames.length]
      const timestamp = Date.now().toString().slice(-4)
      setEmail(`test+${timestamp}@parisjanitor.com`)
      setPassword('Password123!')
      setFullName(randomName)
      setPhone(`+3312345${timestamp}`)
      setRole('traveler')
    }
    setError('')
    setSuccessMessage('')
  }, [isLogin])
  if (user) {
    return <Navigate to={`/dashboard/${user.role?.replace('_', '-')}`} replace />
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)
    if (!email.trim()) {
      setError('L\'email est requis')
      setIsSubmitting(false)
      return
    }
    if (!password.trim()) {
      setError('Le mot de passe est requis')
      setIsSubmitting(false)
      return
    }
    if (!isLogin) {
      if (!fullName.trim()) {
        setError('Le nom complet est requis')
        setIsSubmitting(false)
        return
      }
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        setIsSubmitting(false)
        return
      }
    }
    try {
      if (isLogin) {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password, {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role,
        })
        setSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.')
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute left-4 top-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-3 py-1 text-sm"
        >
          <span className="mr-1">←</span>
          <span>Retour</span>
        </Button>
      </div>
      {isDevelopment && (
        <div className="fixed top-2 left-2 z-50 flex space-x-2">
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium">
            🔧 DEV MODE
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${
            navigator.onLine 
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            {navigator.onLine ? '🌐 En ligne' : '❌ Hors ligne'}
          </div>
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-2 py-1 rounded-md text-xs font-medium">
              🚨 Error: {error.slice(0, 30)}...
            </div>
          )}
        </div>
      )}
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isLogin ? 'Se connecter' : 'S\'inscrire'}</CardTitle>
                <CardDescription>
                  {isLogin 
                    ? 'Entrez vos identifiants pour accéder à votre compte'
                    : 'Remplissez les informations pour créer votre compte'
                  }
                </CardDescription>
              </div>
              {isDevelopment && (
                <div className="relative group">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillDevCredentials}
                      className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 shadow-sm"
                    >
                      🚀 Dev Fill
                    </Button>
                  </div>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                      <div>{isLogin ? 'Fill with test credentials' : 'Fill with sample registration data'}</div>
                      <div className="text-gray-400 mt-1">⌘⇧F (Ctrl+Shift+F)</div>
                      <div className="text-gray-400 mt-1">🌐 Test server connection</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value)
                    // Don't clear error on typing - let user see the error message
                    if (successMessage) setSuccessMessage('')
                  }}
                  placeholder="Entrez votre email"
                  autoComplete="off"
                  className={`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all duration-200 ${
                    error && !email.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value)
                    // Don't clear error on typing - let user see the error message
                    if (successMessage) setSuccessMessage('')
                  }}
                  placeholder="Entrez votre mot de passe"
                  autoComplete="new-password"
                  className={`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all duration-200 ${
                    error && !password.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFullName(e.target.value)
                        if (error && successMessage) setSuccessMessage('')
                      }}
                      className={`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all duration-200 ${
                        error && !fullName.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setPhone(e.target.value)
                        if (error && successMessage) setSuccessMessage('')
                      }}
                      className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Type de compte</Label>
                    <Select
                      value={role} 
                      onValueChange={(value: 'property_owner' | 'traveler' | 'service_provider') => setRole(value)}
                      >
                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-10 bg-white">
                        <SelectItem value="traveler">Voyageur</SelectItem>
                        <SelectItem value="property_owner">Propriétaire</SelectItem>
                        <SelectItem value="service_provider">Prestataire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                  <svg className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 text-sm">{successMessage}</span>
                </div>
              )}

              {error && (
                <div className={`border rounded-lg p-4 flex items-start space-x-3 ${
                  error.includes('Échec de connexion') || error.includes('Impossible de se connecter') || error.includes('Délai d\'attente')
                    ? 'bg-red-100 border-red-300 shadow-lg' // More prominent for connection errors
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex-shrink-0">
                    {error.includes('Échec de connexion') || error.includes('Impossible de se connecter') ? (
                      <div className="w-5 h-5 text-red-600 animate-pulse">🔌</div>
                    ) : error.includes('Délai d\'attente') ? (
                      <div className="w-5 h-5 text-red-600">⏱️</div>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-red-700 text-sm leading-relaxed">{error}</span>
                    {(error.includes('Échec de connexion') || error.includes('Impossible de se connecter')) && (
                      <div className="mt-3 flex items-center space-x-3">
                        <div className="text-xs text-red-600">
                          💡 Astuces: Vérifiez votre WiFi, désactivez le VPN si activé
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setError('')
                            const form = document.querySelector('form')
                            if (form) {
                              const submitEvent = new Event('submit', { 
                                bubbles: true, 
                                cancelable: true 
                              })
                              form.dispatchEvent(submitEvent)
                            }
                          }}
                          className="text-xs h-6 px-2 border-red-300 text-red-700 hover:bg-red-50"
                        >
                          🔄 Réessayer
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-all duration-200" 
                loading={loading || isSubmitting}
                disabled={loading || isSubmitting}
              >
                {isLogin ? '🔑 Se connecter' : '🚀 S\'inscrire'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-all duration-200"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setSuccessMessage('')
                  setEmail('')
                  setPassword('')
                  setFullName('')
                  setPhone('')
                  setRole('traveler')
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
