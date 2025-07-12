'use client'

import { useEffect, useState } from 'react'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Plus, User, LogOut, Users, Globe, Mail, Menu } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'
import { revalidateProfile } from '@/lib/swr'
import type { Profile } from '@/types'
import { useFlags } from '@/hooks/useFlags'

export default function Navbar() {
  const supabase = createClient()
  const flags = useFlags()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const {
    data: profile,
    error,
    isLoading,
  } = useSWR<Profile>(SWRKeys.PROFILE, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 1,
    refreshInterval: 0, // Don't auto-refresh, only on auth changes
  })

  // Listen for auth state changes and revalidate profile data only
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Only revalidate profile data, not posts (to avoid redirect loops)
        revalidateProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsMobileMenuOpen(false)
    // revalidateProfile() will be called by the auth state change listener
  }

  const isAuthenticated = profile && !error

  return (
    <nav className='border-b bg-white'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo/Title */}
          <Link
            href={isAuthenticated ? '/home' : '/'}
            className='font-bold text-xl text-gray-900'
          >
            Family Blog
          </Link>

          {/* Desktop Navigation Items */}
          <div className='hidden md:flex items-center space-x-4'>
            {isLoading ? (
              <div
                className='w-8 h-8 bg-gray-200 rounded-full animate-pulse'
                data-testid='loading-skeleton'
              />
            ) : isAuthenticated ? (
              <>
                {/* Albums Link */}
                <Button asChild variant='ghost' size='sm'>
                  <Link href='/albums'>
                    <Users className='w-4 h-4 mr-2' />
                    Albums
                  </Link>
                </Button>

                {/* Discover Albums Link */}
                {flags.discover && (
                  <Button asChild variant='ghost' size='sm'>
                    <Link href='/discover'>
                      <Globe className='w-4 h-4 mr-2' />
                      Discover
                    </Link>
                  </Button>
                )}

                {/* Create Post Button */}
                <Button asChild size='sm'>
                  <Link href='/create'>
                    <Plus className='w-4 h-4 mr-2' />
                    Share Memory
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      className='relative h-8 w-8 rounded-full'
                    >
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) ||
                            profile?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56' align='end' forceMount>
                    <div className='flex items-center justify-start gap-2 p-2'>
                      <div className='flex flex-col space-y-1 leading-none'>
                        <p className='font-medium text-sm'>
                          {profile?.full_name || 'User'}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {profile?.email}
                        </p>
                      </div>
                    </div>
                    {flags.profile && (
                      <DropdownMenuItem asChild>
                        <Link href='/profile'>
                          <User className='w-4 h-4 mr-2' />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href='/invites'>
                        <Mail className='w-4 h-4 mr-2' />
                        Invites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className='w-4 h-4 mr-2' />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild variant='outline'>
                <Link href='/login'>Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className='md:hidden'>
            {isLoading ? (
              <div
                className='w-8 h-8 bg-gray-200 rounded-full animate-pulse'
                data-testid='loading-skeleton'
              />
            ) : isAuthenticated ? (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    data-testid='mobile-menu-button'
                  >
                    <Menu className='h-5 w-5' />
                    <span className='sr-only'>Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side='right'
                  className='w-[300px] sm:w-[350px] p-4'
                  data-testid='mobile-menu-content'
                >
                  <div className='mt-6 flex flex-col space-y-4'>
                    {/* User Profile Section */}
                    <div className='flex items-center space-x-3 pb-4 border-b'>
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) ||
                            profile?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                        <p className='font-medium text-sm'>
                          {profile?.full_name || 'User'}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {profile?.email}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <Button
                      asChild
                      variant='ghost'
                      className='justify-start'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href='/albums'>
                        <Users className='w-4 h-4 mr-2' />
                        Albums
                      </Link>
                    </Button>

                    {flags.discover && (
                      <Button
                        asChild
                        variant='ghost'
                        className='justify-start'
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href='/discover'>
                          <Globe className='w-4 h-4 mr-2' />
                          Discover
                        </Link>
                      </Button>
                    )}

                    <Button
                      asChild
                      className='justify-start'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href='/create'>
                        <Plus className='w-4 h-4 mr-2' />
                        Share Memory
                      </Link>
                    </Button>

                    <div className='pt-4 border-t'>
                      {flags.profile && (
                        <Button
                          asChild
                          variant='ghost'
                          className='justify-start w-full'
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href='/profile'>
                            <User className='w-4 h-4 mr-2' />
                            Profile
                          </Link>
                        </Button>
                      )}

                      <Button
                        asChild
                        variant='ghost'
                        className='justify-start w-full'
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href='/invites'>
                          <Mail className='w-4 h-4 mr-2' />
                          Invites
                        </Link>
                      </Button>

                      <Button
                        variant='ghost'
                        className='justify-start w-full text-red-600 hover:text-red-700 hover:bg-red-50'
                        onClick={handleSignOut}
                      >
                        <LogOut className='w-4 h-4 mr-2' />
                        Sign out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button asChild variant='outline' size='sm'>
                <Link href='/login'>Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
