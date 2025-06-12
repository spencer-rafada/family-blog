import { NextRequest, NextResponse } from 'next/server'
import { getAlbum, updateAlbum, deleteAlbum } from '@/lib/actions/albums'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const album = await getAlbum(id)
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }
    return NextResponse.json(album)
  } catch (error: any) {
    console.error('Error in album API route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch album' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const data = await request.json()
    const album = await updateAlbum(id, data)
    return NextResponse.json(album)
  } catch (error: any) {
    console.error('Error updating album:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update album' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await deleteAlbum(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting album:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete album' },
      { status: 500 }
    )
  }
}
