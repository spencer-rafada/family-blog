import { NextResponse } from 'next/server'
import { getPublicAlbums } from '@/lib/actions/albums'

export async function GET() {
  try {
    const albums = await getPublicAlbums()
    return NextResponse.json(albums)
  } catch (error: any) {
    console.error('Error in public albums API route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch public albums' },
      { status: 500 }
    )
  }
}