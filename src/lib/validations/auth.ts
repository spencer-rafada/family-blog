import { z } from 'zod'

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Please enter a valid email address')

/**
 * Password validation schema with minimum length requirement
 */
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters')

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

/**
 * Reset password form validation schema with password confirmation
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Sign up form validation schema
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(1, 'Full name is required'),
})