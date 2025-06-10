'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, User, LogOut } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'
import { revalidateProfile } from '@/lib/swr'
import type { Profile } from '@/types'

export default function Navbar() {
  const supabase = createClient()
  const { data: profile, error, isLoading } = useSWR<Profile>(SWRKeys.PROFILE, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 1,
    refreshInterval: 0, // Don't auto-refresh, only on auth changes
  })

  // Listen for auth state changes and revalidate profile data only
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          // Only revalidate profile data, not posts (to avoid redirect loops)
          revalidateProfile()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // revalidateProfile() will be called by the auth state change listener
  }

  const isAuthenticated = profile && !error

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href={isAuthenticated ? "/home" : "/"} className="font-bold text-xl text-gray-900">
            Family Blog
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {/* Create Post Button */}
                <Button asChild size="sm">
                  <Link href="/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Share Memory
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) || profile?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}