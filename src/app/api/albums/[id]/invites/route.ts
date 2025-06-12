import { NextRequest, NextResponse } from 'next/server'
import { getAlbumInvites, createAlbumInvite } from '@/lib/actions/albums'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invites = await getAlbumInvites(params.id)
    return NextResponse.json(invites)
  } catch (error: any) {
    console.error('Error in album invites API route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch album invites' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { email, role } = await request.json()
    const invite = await createAlbumInvite(params.id, email, role)
    return NextResponse.json(invite)
  } catch (error: any) {
    console.error('Error creating album invite:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create album invite' },
      { status: 500 }
    )
  }
}