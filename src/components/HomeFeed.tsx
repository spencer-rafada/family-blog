'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import PostFeed from '@/components/PostFeed'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'
import type { Profile } from '@/types'

export default function HomeFeed() {
  const router = useRouter()
  const { data: profile, isLoading, error } = useSWR<Profile>(SWRKeys.PROFILE, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1,
    revalidateOnReconnect: false,
  })

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!isLoading && (error || !profile)) {
      router.replace('/')
    }
  }, [profile, error, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If no profile or error, don't render anything (we're redirecting)
  if (!profile || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Welcome Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.full_name || 'Family'}!
          </h1>
          <p className="text-gray-600 mb-6">
            See the latest memories from all your albums and family posts
          </p>
          <Button asChild>
            <Link href="/create">
              <Plus className="w-4 h-4 mr-2" />
              Share a New Memory
            </Link>
          </Button>
        </div>

        {/* Post Feed */}
        <PostFeed />
      </div>
    </div>
  )
}