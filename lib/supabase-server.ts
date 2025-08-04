import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// Server-side Supabase client
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Helper function for server-side authenticated requests
export const serverAuthenticatedRequest = async (requestFn: Function) => {
  try {
    const supabase = createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      throw error
    }
    
    if (!session) {
      throw new Error('No active session found')
    }
    
    return await requestFn(supabase)
  } catch (error) {
    console.error('Error in server authenticated request:', error)
    throw error
  }
}