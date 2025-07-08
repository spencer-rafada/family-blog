'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, Camera, Shield } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'
import type { Profile } from '@/types'

export default function LandingPage() {
  const router = useRouter()
  const { data: profile, isLoading, error } = useSWR<Profile>(SWRKeys.PROFILE, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1,
    revalidateOnReconnect: false,
  })

  // Redirect authenticated users to home (only on valid profile, not on loading)
  useEffect(() => {
    if (!isLoading && !error && profile) {
      router.replace('/home')
    }
  }, [profile, isLoading, error, router])

  // Show loading while checking auth or redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If we have a valid profile, don't render anything (we're redirecting)
  if (profile && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Share Life&apos;s Precious
            <span className="text-blue-600"> Moments</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Keep your family connected with a private space to share photos, 
            milestones, and memories of your little ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Photo Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Upload and organize photos with captions and milestones
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Family Only</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Private, invite-only space for family members
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track special moments like first steps and birthdays
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your family&apos;s memories are private and secure
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Start Sharing?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Join your family&apos;s private blog and start sharing those special moments today.
              </p>
              <Button asChild size="lg">
                <Link href="/login">Join Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}