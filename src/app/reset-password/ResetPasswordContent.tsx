import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface ResetPasswordContentProps {
  error?: string
}

export async function ResetPasswordContent({ error }: ResetPasswordContentProps) {
  if (error) {
    redirect('/forgot-password?error=invalid-reset-link')
  }

  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    // User is not authenticated, redirect to forgot password with error
    redirect('/forgot-password?error=session-expired')
  }

  return <ResetPasswordForm />
}