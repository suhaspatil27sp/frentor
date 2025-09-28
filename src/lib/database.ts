// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Main client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// For API routes that need admin access (use sparingly)
export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceKey) {
    throw new Error('Service role key not available')
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}