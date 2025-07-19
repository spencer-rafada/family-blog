'use server'

import { createClient } from '@/lib/supabase/server'

// Simple in-memory rate limiting (consider using Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting check for password reset requests
 * @param email - The email to check rate limit for
 * @returns true if rate limit exceeded, false otherwise
 */
function isRateLimited(email: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(email)

  if (!limit || now > limit.resetTime) {
    // Reset or initialize the rate limit
    rateLimitMap.set(email, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour from now
    })
    return false
  }

  if (limit.count >= 3) {
    return true
  }

  limit.count++
  return false
}

/**
 * Sends a password reset email to the user with rate limiting
 *
 * @param email - The email address of the user requesting password reset
 * @returns Object with success status or error message
 *
 * @example
 * ```ts
 * const result = await requestPasswordReset('user@example.com')
 * if (result.error) {
 *   console.error(result.error)
 * }
 * ```
 *
 * @remarks
 * - Rate limited to 3 requests per email per hour
 * - Sends email via Supabase Auth
 * - Uses custom recovery email template
 */
export async function requestPasswordReset(email: string) {
  // Check rate limiting
  if (isRateLimited(email)) {
    return {
      error: 'Too many password reset attempts. Please try again in an hour.',
    }
  }
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?type=recovery`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Updates the current user's password
 *
 * @param password - The new password to set (must be at least 6 characters)
 * @returns Object with success status or error message
 *
 * @example
 * ```ts
 * const result = await updatePassword('newSecurePassword123')
 * if (result.success) {
 *   redirect('/login?message=password-reset-success')
 * }
 * ```
 *
 * @remarks
 * - Requires user to be authenticated
 * - Clears rate limiting on successful update
 * - Password must meet Supabase requirements
 */
export async function updatePassword(password: string) {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'You must be logged in to reset your password' }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Clear any rate limiting for this user's email
  if (user.email) {
    rateLimitMap.delete(user.email)
  }

  return { success: true }
}
