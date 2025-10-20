
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { envConfig } from '@/lib/env-config'

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
  const { user, signIn, signUp } = useAuthStore()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'property_owner' | 'traveler' | 'service_provider'>('traveler')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedDevUserType, setSelectedDevUserType] = useState<'property_owner' | 'traveler' | 'service_provider'>('property_owner')
  const isDevelopment = import.meta.env.DEV
  
  useEffect(() => {
    if (user && isSubmitting) {
      console.debug('AuthPage: User authenticated successfully, updating UI')
      setIsSubmitting(false)
      setSuccessMessage('Connexion réussie ! Redirection en cours...')
      setTimeout(() => {
        navigate(`/dashboard/${user.role?.replace('_', '-')}`)
      }, 1000)
    }
  }, [user, isSubmitting, navigate])

  useEffect(() => {
    if (isSubmitting && isLogin) {
      const timeout = setTimeout(() => {
        console.warn('AuthPage: Login timeout - resetting isSubmitting state')
        setIsSubmitting(false)
        if (!error) {
          setError('⏱️ Délai d\'attente dépassé - La connexion prend trop de temps')
        }
      }, 30000)

      return () => clearTimeout(timeout)
    }
  }, [isSubmitting, isLogin, error])

  const fillDevCredentials = useCallback((userType?: 'property_owner' | 'traveler' | 'service_provider') => {
    const devUserType = userType || selectedDevUserType
    const devUser = envConfig.dev[devUserType === 'property_owner' ? 'propertyOwner' : 
                                    devUserType === 'traveler' ? 'traveler' : 'serviceProvider']
    
    if (isLogin) {
      setEmail(devUser.email)
      setPassword(devUser.password)
    } else {
      const timestamp = Date.now().toString().slice(-4)
      setEmail(devUser.email)
      setPassword(devUser.password)
      setFullName(devUser.fullName)
      setPhone(`${devUser.phone.slice(0, -1)}${timestamp.slice(-1)}`)
      setRole(devUser.role)
    }
    setError('')
    setSuccessMessage('')
  }, [isLogin, selectedDevUserType])

  if (user && !isSubmitting) {
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
        console.debug('AuthPage: Starting login process')
        await signIn(email.trim(), password)
        console.debug('AuthPage: Login completed successfully')
      } else {
        console.debug('AuthPage: Starting signup process')
        await signUp(email.trim(), password, {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role,
        })
        console.debug('AuthPage: Signup completed successfully')
        setSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.')
        setIsLogin(true)
        setPassword('')
        setIsSubmitting(false)
      }
    } catch (err: unknown) {
      console.error('AuthPage: Authentication error:', err)
      const errorMessage = getErrorMessage(err)
      console.debug('AuthPage: Setting error message:', errorMessage)
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 relative bg-gradient-to-r from-[#62cff4] to-[#2c67f2] flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative text-center text-white max-w-md">
          <div className="mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-2xl mx-auto mb-6">
              PJ
            </div>
            <h1 className="text-4xl font-bold mb-4">Paris Janitor</h1>
            <p className="text-xl text-white/90">
              Gestion locative simplifiée en France
            </p>
          </div>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-white/80"></div>
              <span className="text-white/90">Propriétaires, voyageurs et prestataires</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-white/80"></div>
              <span className="text-white/90">Commission de seulement 20%</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-white/80"></div>
              <span className="text-white/90">Support client 24h/7j</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md relative">
          <div className="absolute -top-4 -left-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              <span>←</span>
              <span>Retour</span>
            </Button>
          </div>
      {isDevelopment && (
        <div className="w-1/4 fixed bottom-16 left-2 z-50 space-y-2">
          <div className="flex space-x-2">
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium">
              🔧 DEV MODE
            </div>
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${navigator.onLine
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
            <div className='flex-1'></div>
          </div>
          
          {/* Dev User Type Selector & Fill Buttons */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm max-w-md">
            <div className="text-xs font-medium text-gray-700 mb-2">🧪 Dev Credentials</div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Select 
                  value={selectedDevUserType} 
                  onValueChange={(value: 'property_owner' | 'traveler' | 'service_provider') => setSelectedDevUserType(value)}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    <SelectItem value="property_owner">🏠 Propriétaire</SelectItem>
                    <SelectItem value="traveler">✈️ Voyageur</SelectItem>
                    <SelectItem value="service_provider">🔧 Prestataire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDevCredentials(selectedDevUserType)}
                  className="text-xs bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 flex-1"
                >
                  {selectedDevUserType === 'property_owner' ? '🏠' : 
                   selectedDevUserType === 'traveler' ? '✈️' : '🔧'} 
                  Fill {selectedDevUserType === 'property_owner' ? 'Owner' : 
                        selectedDevUserType === 'traveler' ? 'Traveler' : 'Provider'}
                </Button>
                
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDevCredentials('property_owner')}
                    className="text-xs bg-green-50 border-green-200 text-green-800 hover:bg-green-100 px-2"
                    title="Fill Property Owner"
                  >
                    🏠
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDevCredentials('traveler')}
                    className="text-xs bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 px-2"
                    title="Fill Traveler"
                  >
                    ✈️
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDevCredentials('service_provider')}
                    className="text-xs bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 px-2"
                    title="Fill Service Provider"
                  >
                    🔧
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Email: {envConfig.dev[selectedDevUserType === 'property_owner' ? 'propertyOwner' : 
                                     selectedDevUserType === 'traveler' ? 'traveler' : 'serviceProvider'].email}
              </div>
            </div>
          </div>
        </div>
      )}
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-4xl font-bold text-gray-900">
                {isLogin ? 'Connexion' : 'Inscription'}
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte Paris Janitor'}
              </p>
            </div>

            <Card className="rounded-2xl bg-white/80 backdrop-blur-sm border-gray-100 shadow-xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {isLogin ? 'Se connecter' : 'S\'inscrire'}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {isLogin
                    ? 'Entrez vos identifiants pour accéder à votre compte'
                    : 'Remplissez les informations pour créer votre compte'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setEmail(e.target.value)
                          if (error) setError('')
                          if (successMessage) setSuccessMessage('')
                        }}
                        placeholder="Entrez votre email"
                        autoComplete="off"
                        className={`mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 ${error && !email.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                          }`}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPassword(e.target.value)
                          if (error) setError('')
                          if (successMessage) setSuccessMessage('')
                        }}
                        placeholder="Entrez votre mot de passe"
                        autoComplete="new-password"
                        className={`mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 ${error && !password.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                          }`}
                        required
                      />
                    </div>


                    {!isLogin && (
                      <>
                        <div>
                          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Nom complet</Label>
                          <Input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFullName(e.target.value)
                              if (error) setError('')
                              if (successMessage) setSuccessMessage('')
                            }}
                            className={`mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 ${error && !fullName.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                              }`}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Téléphone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setPhone(e.target.value)
                              if (error) setError('')
                              if (successMessage) setSuccessMessage('')
                            }}
                            className="mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                          />
                        </div>

                        <div>
                          <Label htmlFor="role" className="text-sm font-medium text-gray-700">Type de compte</Label>
                          <Select
                            value={role}
                            onValueChange={(value: 'property_owner' | 'traveler' | 'service_provider') => setRole(value)}
                          >
                            <SelectTrigger className="mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-10 bg-white rounded-xl border-gray-200 shadow-lg">
                              <SelectItem value="traveler">✈️ Voyageur</SelectItem>
                              <SelectItem value="property_owner">🏠 Propriétaire</SelectItem>
                              <SelectItem value="service_provider">🔧 Prestataire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                  {successMessage && (
                    <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
                      <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700 font-medium">{successMessage}</span>
                    </div>
                  )}

                  {error && (
                    <div className={`border rounded-xl p-4 flex items-start space-x-3 ${error.includes('Échec de connexion') || error.includes('Impossible de se connecter') || error.includes('Délai d\'attente')
                      ? 'bg-red-100/80 border-red-300 shadow-lg'
                      : 'bg-red-50/80 border-red-200'
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
                      className="w-full bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isSubmitting}
                    >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{isLogin ? 'Connexion...' : 'Inscription...'}</span>
                      </div>
                    ) : (
                      <span>{isLogin ? '🔑 Se connecter' : '🚀 S\'inscrire'}</span>
                    )}
                  </Button>
                  </div>
                </form>

                <div className="mt-8 text-center">
                  <Button
                    variant="link"
                    className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium"
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
      </div>
    </div>
  )
}
