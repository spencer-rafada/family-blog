import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const inviteToken = searchParams.get('invite_token')
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Create the redirect URL based on context
      let redirectUrl: string
      
      if (type === 'recovery') {
        // Password reset flow
        redirectUrl = `${origin}/reset-password`
      } else if (inviteToken) {
        redirectUrl = `${origin}/invite/accept/${inviteToken}?redirected=true`
      } else {
        redirectUrl = `${origin}${next}`
      }
      
      // Return the redirect response
      // The session cookies should be automatically set by exchangeCodeForSession
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If there was an error or no code, redirect appropriately
  if (inviteToken) {
    return NextResponse.redirect(`${origin}/invite/accept/${inviteToken}?error=auth_failed`)
  }
  
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}