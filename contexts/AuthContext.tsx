'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { User as AppUser } from '@/types'
import toast from 'react-hot-toast'

interface SellerDetails {
  id: string
  user_id: string
  business_name: string
  owner_name: string
  seller_type: 'wholesaler' | 'manufacturer'
  registration_number?: string
  gst_number?: string
  profile_image_url?: string
  address: any
  location_address?: string
  latitude?: number
  longitude?: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: AppUser | null
  sellerDetails: SellerDetails | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [sellerDetails, setSellerDetails] = useState<SellerDetails | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        setSession(session)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setSellerDetails(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      // Only allow sellers, wholesalers, and manufacturers
      if (!['seller', 'wholesaler', 'manufacturer'].includes(profile.role)) {
        toast.error('Access denied. This console is only for sellers, wholesalers, and manufacturers.')
        await signOut()
        return
      }

      setUser(profile as AppUser)

      // Fetch seller details
      await fetchSellerDetails(userId)
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  const fetchSellerDetails = async (userId: string) => {
    try {
      const { data: sellerData, error } = await supabase
        .from('seller_details')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Seller details not found for this user. Profile may be incomplete.')
        } else {
          console.error('Error fetching seller details:', error)
        }
        return
      }
      
      setSellerDetails(sellerData)
    } catch (error) {
      console.error('Unexpected error in fetchSellerDetails:', error)
    }
  }

  // OTP authentication is now handled directly in the login page
  // This context will automatically update when auth state changes

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        toast.error('Error signing out')
      } else {
        setUser(null)
        setSellerDetails(null)
        setSession(null)
        toast.success('Signed out successfully')
      }
    } catch (error) {
      console.error('Error in signOut:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id)
    }
  }

  const value = {
    user,
    sellerDetails,
    session,
    loading,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}