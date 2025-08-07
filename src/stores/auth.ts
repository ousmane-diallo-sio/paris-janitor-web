import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string, userData: Partial<UserProfile>) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            ...userData,
          })
        if (profileError) throw profileError
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      set({ loading: false })
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, loading: false })
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            set({ user: data })
          })
      }
    })

    supabase.auth.onAuthStateChange(async (_, session) => {
      set({ session })
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ user: data })
      } else {
        set({ user: null })
      }
    })
  },
}))
