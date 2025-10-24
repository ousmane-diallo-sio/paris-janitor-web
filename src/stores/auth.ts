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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      throw error
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: session } = await supabase.auth.getSession()
    if (session.session?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single()
      
      if (profileError) {
        throw profileError
      }
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
            
            if (error.code === '42501' || 
                (error.message && error.message.includes('ACCOUNT_LOCKED'))) {
              await supabase.auth.signOut()
              set({ user: null, session: null, loading: false })
              throw error
            } else {
              set({ user: null, loading: false })
            }
          } else {
            set({ user: data, loading: false })
          }
        } catch (error) {
          console.error('Error during profile fetch:', error)
          set({ user: null, loading: false })
          throw error
        }
      } else {
        set({ user: null, loading: false })
      }
    })

    supabase.auth.onAuthStateChange((_, session) => {
      set({ session })
      
      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (error) {
              console.error('Error fetching profile on auth change:', error)
              
              if (error.code === '42501' || 
                  (error.message && error.message.includes('ACCOUNT_LOCKED'))) {
                await supabase.auth.signOut()
                set({ user: null, session: null })
                throw error
              } else {
                set({ user: null })
              }
            } else {
              set({ user: data })
            }
          } catch (error) {
            console.error('Profile fetch error:', error)
            set({ user: null, session: null })
            throw error
          }
        }, 0)
      } else {
        set({ user: null })
      }
    })
  },
}))
