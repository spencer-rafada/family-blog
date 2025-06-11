'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

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
      setMessage('Check your email for the confirmation link!')
    }
    setLoading(false)
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold'>Join the Family</CardTitle>
          <CardDescription>
            Create your account to view family updates
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              />
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
              <Link href='/login' className='text-blue-600 hover:underline'>
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
