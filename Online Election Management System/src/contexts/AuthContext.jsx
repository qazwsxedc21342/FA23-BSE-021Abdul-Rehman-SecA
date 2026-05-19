import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { runQuery, withTimeout } from '../lib/electionData'

const AuthContext = createContext({})

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId, sessionUser = null) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single(),
        'Loading profile'
      )
        
      if (error) {
         console.error('Profile fetch error:', error);
         
         // If profile doesn't exist, create it from session user
         if (error.code === 'PGRST116' && sessionUser) {
            let defaultRole = sessionUser.user_metadata?.requested_role || 'voter'
            if (sessionUser.email === 'admin@votesecure.com') defaultRole = 'admin'
            if (sessionUser.email === 'creator@votesecure.com') defaultRole = 'election_creator'

            const fallbackProfile = {
               id: userId,
               name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
               email: sessionUser.email,
               role: defaultRole,
               verified: Boolean(sessionUser.email_confirmed_at)
            }
            
            await runQuery(
              supabase.from('users').insert(fallbackProfile),
              'Creating profile'
            )
            
            setProfile(fallbackProfile)
            return fallbackProfile
         }
         
         throw error;
      }
      
      setProfile(data)
      return data
    } catch (err) {
      console.error('Profile fetch failed:', err)
      // Don't create fallback profile if there's an error
      setProfile(null)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    
    // Timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout - forcing completion')
        setLoading(false)
      }
    }, 5000) // 5 second timeout
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user).finally(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.error('Session fetch error:', err)
      if (mounted) setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth state changed:', event)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id, session.user)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )
    
    // Listen for profile changes in real-time
    let profileSubscription = null
    if (user?.id) {
      profileSubscription = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile updated:', payload.new)
            setProfile(payload.new)
          }
        )
        .subscribe()
    }
    
    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
      if (profileSubscription) {
        profileSubscription.unsubscribe()
      }
    }
  }, [user?.id])

  const signUp = async ({ email, password, name, phone, role = 'voter' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, requested_role: role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    
    // Insert into users table with correct role
    if (data.user) {
      // For election_creator, grant role immediately instead of waiting for approval
      const userRole = role;
      
      const { error: profileError } = await supabase.from('users').upsert({
          id: data.user.id,
          email,
          name,
          phone,
          role: userRole, // Use the requested role
          verified: Boolean(data.user.email_confirmed_at),
        })

      if (profileError) {
        console.warn('Profile creation warning:', profileError)
      }

      // If election_creator, create approval request
      if (role === 'election_creator') {
        try {
          const { data: existingRequest } = await runQuery(
            supabase
              .from('creator_requests')
              .select('id')
              .eq('user_id', data.user.id)
              .eq('status', 'pending')
              .maybeSingle(),
            'Checking creator approval request'
          )

          if (!existingRequest) {
            await runQuery(
              supabase.from('creator_requests').insert({
                user_id: data.user.id,
                purpose: 'Election management and organization',
                organization: 'Pending verification',
                status: 'pending',
              }),
              'Creating creator approval request'
            )
          }
        } catch (requestError) {
          console.warn('Creator request warning:', requestError)
        }
      }
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const refreshProfile = () => user ? fetchProfile(user.id) : null

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    isAdmin:   profile?.role === 'admin',
    isCreator: profile?.role === 'election_creator',
    isVoter:   profile?.role === 'voter',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
