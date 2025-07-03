'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface SignUpFormProps {
  inviteToken?: string
  inviteEmail?: string
  isInviteContext?: boolean
}

export function SignUpForm({ inviteToken, inviteEmail, isInviteContext }: SignUpFormProps) {
  const [email, setEmail] = useState(inviteEmail || '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail)
    }
  }, [inviteEmail])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      console.log(error)
      setError(error.message)
    } else {
      if (isInviteContext) {
        setMessage('Check your email for the confirmation link! After confirming, you can return to accept your invitation.')
      } else {
        setMessage('Check your email for the confirmation link!')
      }
    }
    setLoading(false)
  }

  const loginUrl = inviteToken 
    ? `/login?invite_token=${inviteToken}`
    : '/login'

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold'>
            {isInviteContext ? 'Accept Your Invitation' : 'Join the Family'}
          </CardTitle>
          <CardDescription>
            {isInviteContext 
              ? 'Create your account to join the album'
              : 'Create your account to view family updates'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInviteContext && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                You&apos;ve been invited to join an album! Create your account with the email address{' '}
                <strong>{inviteEmail}</strong> to accept the invitation.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSignUp} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='fullName'>Full Name</Label>
              <Input
                id='fullName'
                type='text'
                placeholder='Enter your full name'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isInviteContext && !!inviteEmail}
              />
              {isInviteContext && inviteEmail && (
                <p className="text-xs text-gray-600">
                  This email is pre-filled from your invitation
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                placeholder='Create a password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className='text-red-600 text-sm text-center bg-red-50 p-2 rounded'>
                {error}
              </div>
            )}

            {message && (
              <div className='text-green-600 text-sm text-center bg-green-50 p-2 rounded'>
                {message}
              </div>
            )}

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className='text-center text-sm text-gray-600'>
              Already have an account?{' '}
              <Link href={loginUrl} className='text-blue-600 hover:underline'>
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}