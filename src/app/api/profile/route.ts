import { NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/actions/profile'

export async function GET() {
  try {
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json(profile)
  } catch (error: unknown) {
    console.error('Error in profile API route:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch profile',
      },
      { status: 500 }
    )
  }
}
