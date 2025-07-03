'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginFormProps {
  inviteToken?: string
  redirectTo?: string
  isInviteContext?: boolean
}

export function LoginForm({ inviteToken, redirectTo, isInviteContext }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      // Handle redirects based on context
      if (inviteToken) {
        router.push(`/invite/accept/${inviteToken}?redirected=true`)
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push('/')
      }
      router.refresh()
    }
    setLoading(false)
  }

  const signupUrl = inviteToken 
    ? `/signup?invite_token=${inviteToken}`
    : '/signup'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isInviteContext ? 'Sign In to Accept Invite' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isInviteContext 
              ? 'Sign in to accept your invitation and join the album'
              : 'Sign in to view family updates and memories'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {isInviteContext ? "Don't have an account? " : 'Have an invite? '}
              <Link href={signupUrl} className="text-blue-600 hover:underline">
                Create your account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}