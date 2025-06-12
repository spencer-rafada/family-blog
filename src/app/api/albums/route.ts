import { NextRequest, NextResponse } from 'next/server'
import { getAlbums, createAlbum } from '@/lib/actions/albums'

export async function GET() {
  try {
    const albums = await getAlbums()
    return NextResponse.json(albums)
  } catch (error: any) {
    console.error('Error in albums API route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const album = await createAlbum(data)
    return NextResponse.json(album)
  } catch (error: any) {
    console.error('Error creating album:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create album' },
      { status: 500 }
    )
  }
}
