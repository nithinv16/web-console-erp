import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'

// Client-side Supabase client
export const createClient = () => createClientComponentClient<Database>()

// Helper function for authenticated requests
export const authenticatedRequest = async (requestFn: Function) => {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      throw error
    }
    
    if (!session) {
      throw new Error('No active session found')
    }
    
    return await requestFn()
  } catch (error) {
    console.error('Error in authenticated request:', error)
    throw error
  }
}

// Validate connection
export const validateConnection = async (): Promise<{
  success: boolean
  message: string
  serverTime?: string
}> => {
  try {
    const supabase = createClient()
    const startTime = Date.now()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    if (error && error.code !== '42P01') {
      return {
        success: false,
        message: `Database error: ${error.message}`
      }
    }
    
    const pingTime = Date.now() - startTime
    return {
      success: true,
      message: `Successfully connected to Supabase (${pingTime}ms)`,
      serverTime: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Connection error: ${error.message}`
    }
  }
}