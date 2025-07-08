import { NextResponse } from 'next/server'
import { getPublicAlbums } from '@/lib/actions/albums'
import { discoverFlag } from '@/lib/flags'

export async function GET() {
  try {
    const isDiscoverEnabled = await discoverFlag()
    
    if (!isDiscoverEnabled) {
      return NextResponse.json(
        { error: 'Discover functionality is not available' },
        { status: 404 }
      )
    }
    
    const albums = await getPublicAlbums()
    return NextResponse.json(albums)
  } catch (error: unknown) {
    console.error('Error in public albums API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch public albums' },
      { status: 500 }
    )
  }
}