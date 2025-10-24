import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, User, Mail, Phone, Shield, Trash2, Settings } from 'lucide-react'
import type { TablesUpdate, UserRole } from '@/types/database'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, signOut, loading } = useAuthStore()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    }
  })

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

  const currentRole = user?.role as UserRole

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const updates: TablesUpdate<'profiles'> = {
        full_name: data.full_name,
        phone: data.phone || null,
        updated_at: new Date().toISOString()
      }

      await db.profiles.update(user.id, updates)
      
      const updatedUser = { ...user, ...updates }
      useAuthStore.setState({ user: updatedUser })
      
      setSuccess('Profil mis à jour avec succès!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setError('Veuillez taper "SUPPRIMER" pour confirmer')
      return
    }

    setIsDeleting(true)
    setError('')

    try {

      await db.profiles.delete(user!.id)
      
      await signOut()
      
      navigate('/', { state: { message: 'Votre compte a été supprimé avec succès.' } })
      
    } catch (err) {
      console.error('Delete account error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du compte')
      setIsDeleting(false)
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'property_owner':
        return 'Propriétaire'
      case 'traveler':
        return 'Voyageur'
      case 'service_provider':
        return 'Prestataire de services'
      default:
        return role
    }
  }

  const getDashboardUrl = (role: UserRole) => {
    return `/dashboard/${role.replace('_', '-')}`
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(getDashboardUrl(user!.role as UserRole))}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl flex items-center space-x-2"
                >
                  <span>←</span>
                  <span>Retour au tableau de bord</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
                  <p className="text-white/90 text-lg">
                    Gérez vos informations personnelles
                  </p>
                </div>
              </div>
              <Button onClick={signOut} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl">
                Se déconnecter
              </Button>
            </div>
          </header>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl bg-white/70 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center space-x-3">
                  <User className="h-6 w-6 text-blue-600" />
                  <span>Informations personnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      L'email ne peut pas être modifié
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      {...register('full_name')}
                      className={errors.full_name ? 'border-red-500' : ''}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-500">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Téléphone</span>
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Type de compte</span>
                    </Label>
                    <Select
                      value={currentRole}
                      disabled={true}
                    >
                      <SelectTrigger className="bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="traveler">Voyageur</SelectItem>
                        <SelectItem value="property_owner">Propriétaire</SelectItem>
                        <SelectItem value="service_provider">Prestataire de services</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Le type de compte ne peut pas être modifié.
                    </p>
                  </div>

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 text-sm">{success}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le profil'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl bg-white/70 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span>Informations du compte</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Type de compte</p>
                  <p className="text-gray-600">{getRoleLabel(user!.role as UserRole)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Membre depuis</p>
                  <p className="text-gray-600">
                    {new Date(user!.created_at!).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Dernière mise à jour</p>
                  <p className="text-gray-600">
                    {user!.updated_at ? new Date(user!.updated_at).toLocaleDateString('fr-FR') : 'Jamais'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-red-50/50 backdrop-blur-sm border-red-200 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-red-700 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Zone de danger</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600">
                  La suppression de votre compte est irréversible. Toutes vos données seront perdues.
                </p>
                
                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                    contentClassName='flex flex-row items-center justify-center'
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                ) : (
                  <div className="space-y-6 p-6 bg-red-50/80 rounded-xl border border-red-200">
                    <div>
                      <p className="font-medium text-red-800 mb-2">
                        Êtes-vous sûr de vouloir supprimer votre compte ?
                      </p>
                      <p className="text-sm text-red-700 mb-1">
                        Cette action supprimera définitivement votre profil et toutes vos données.
                      </p>
                      <p className="text-sm text-red-700 mb-4">
                        Pour confirmer, tapez "SUPPRIMER" dans le champ ci-dessous :
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Tapez SUPPRIMER"
                        className="mb-4"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                          setError('')
                        }}
                        className="flex-1 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                        disabled={isDeleting}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
                      >
                        {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
