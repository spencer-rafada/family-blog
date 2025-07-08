import { NextResponse } from 'next/server'
import { getPublicAlbums } from '@/lib/actions/albums'

export async function GET() {
  try {
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