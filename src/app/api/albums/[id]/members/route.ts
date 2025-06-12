import { NextRequest, NextResponse } from 'next/server'
import { getAlbumMembers, addAlbumMember } from '@/lib/actions/albums'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const members = await getAlbumMembers(params.id)
    return NextResponse.json(members)
  } catch (error: any) {
    console.error('Error in album members API route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch album members' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, role } = await request.json()
    const member = await addAlbumMember(params.id, userId, role)
    return NextResponse.json(member)
  } catch (error: any) {
    console.error('Error adding album member:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add album member' },
      { status: 500 }
    )
  }
}