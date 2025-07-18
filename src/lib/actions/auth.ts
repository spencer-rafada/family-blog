'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Sends a password reset email to the user
 * @param email - The email address of the user requesting password reset
 * @returns Object with success status or error message
 */
export async function requestPasswordReset(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Updates the current user's password
 * @param password - The new password to set
 * @returns Object with success status or error message
 */
export async function updatePassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}