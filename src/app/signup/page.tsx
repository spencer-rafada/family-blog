import { SignUpForm } from '@/components/SignUpForm'

interface SignUpPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams
  const inviteToken = Array.isArray(params.invite_token) 
    ? params.invite_token[0] 
    : params.invite_token
  const inviteEmail = Array.isArray(params.email) 
    ? params.email[0] 
    : params.email

  return (
    <SignUpForm 
      inviteToken={inviteToken} 
      inviteEmail={inviteEmail}
      isInviteContext={!!inviteToken}
    />
  )
}
