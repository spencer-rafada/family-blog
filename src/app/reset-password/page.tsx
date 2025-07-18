import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface ResetPasswordPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const token_hash = Array.isArray(params.token_hash) ? params.token_hash[0] : params.token_hash
  const type = Array.isArray(params.type) ? params.type[0] : params.type
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  if (error) {
    redirect('/forgot-password?error=invalid-reset-link')
  }

  // If we have token_hash and type=recovery, verify the token
  if (token_hash && type === 'recovery') {
    const supabase = await createClient()
    
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    })

    if (verifyError) {
      redirect('/forgot-password?error=invalid-reset-link')
    }

    // If verification successful, user is now authenticated and can reset password
  }

  return <ResetPasswordForm />
}