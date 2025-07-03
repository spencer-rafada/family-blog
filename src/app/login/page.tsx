import { LoginForm } from '@/components/LoginForm'

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const inviteToken = Array.isArray(params.invite_token) 
    ? params.invite_token[0] 
    : params.invite_token
  const redirectTo = Array.isArray(params.redirectTo) 
    ? params.redirectTo[0] 
    : params.redirectTo

  return (
    <LoginForm 
      inviteToken={inviteToken} 
      redirectTo={redirectTo}
      isInviteContext={!!inviteToken}
    />
  )
}