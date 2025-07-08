import { NextRequest, NextResponse } from 'next/server'
import { getAlbumMembers, addAlbumMember } from '@/lib/actions/albums'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const members = await getAlbumMembers((await params).id)
    return NextResponse.json(members)
  } catch (error: unknown) {
    console.error('Error in album members API route:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch album members',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await request.json()
    const member = await addAlbumMember((await params).id, userId, role)
    return NextResponse.json(member)
  } catch (error: unknown) {
    console.error('Error adding album member:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to add album member',
      },
      { status: 500 }
    )
  }
}
