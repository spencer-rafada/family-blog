import { NextRequest, NextResponse } from 'next/server'
import { getAlbums, createAlbum } from '@/lib/actions/albums'

export async function GET() {
  try {
    const albums = await getAlbums()
    return NextResponse.json(albums)
  } catch (error: unknown) {
    console.error('Error in albums API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const album = await createAlbum(data)
    return NextResponse.json(album)
  } catch (error: unknown) {
    console.error('Error creating album:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create album' },
      { status: 500 }
    )
  }
}
