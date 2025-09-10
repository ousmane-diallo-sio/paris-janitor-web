import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthState {
  user: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      console.debug('Signing in:', email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.debug('Sign in response error:', error)
      if (error) throw error
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  signUp: async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role || 'traveler'
          }
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  initialize: () => {
    set({ loading: true })
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      set({ session })
      
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (error) {
            console.error('Error fetching profile during init:', error)
            set({ user: null, loading: false })
          } else {
            console.debug('Profile loaded during init:', data)
            set({ user: data, loading: false })
          }
        } catch (error) {
          console.error('Error during profile fetch:', error)
          set({ user: null, loading: false })
        }
      } else {
        set({ user: null, loading: false })
      }
    })

    supabase.auth.onAuthStateChange((event, session) => {
      console.debug('Auth state change:', event, session?.user?.email)
      set({ session })
      
      if (session?.user) {
        // Use setTimeout to avoid deadlock with async Supabase calls
        setTimeout(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (error) {
            console.error('Error fetching profile on auth change:', error)
            set({ user: null })
          } else {
            console.debug('Profile loaded on auth change:', data)
            set({ user: data })
          }
        }, 0)
      } else {
        set({ user: null })
      }
    })
  },
}))
