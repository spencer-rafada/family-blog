'use server'

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Get the current authenticated user or throw an error
 * @param errorMessage - Custom error message if user is not authenticated
 * @returns The authenticated user
 * @throws Error if user is not authenticated
 */
export async function requireAuth(errorMessage?: string): Promise<User> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error(errorMessage || 'You must be logged in to perform this action')
  }
  
  return user
}

/**
 * Get the current user without throwing (returns null if not authenticated)
 * @returns The user or null
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return user
}