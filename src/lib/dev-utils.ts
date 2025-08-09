import { supabase } from './supabase'
import { envConfig } from './env-config'

export const devUtils = {
  async deleteDevUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No user logged in')
      }

      if (user.email !== envConfig.dev.email) {
        throw new Error('Can only delete the dev user')
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        console.warn('Profile deletion error:', profileError)
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (authError) {
        throw authError
      }

      await supabase.auth.signOut()
      
      return { success: true, message: 'Dev user deleted successfully' }
    } catch (error) {
      console.error('Delete dev user error:', error)
      throw error
    }
  },

  async signOutAndClear() {
    try {
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      return { success: true, message: 'Signed out and cleared storage' }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }
}
