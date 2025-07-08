import { NextRequest, NextResponse } from 'next/server'
import { updateAlbumMemberRole, removeAlbumMember } from '@/lib/actions/albums'

export async function PUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { role } = await request.json()
    const member = await updateAlbumMemberRole(params.memberId, role)
    return NextResponse.json(member)
  } catch (error: unknown) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update member role',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    await removeAlbumMember(params.memberId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error removing album member:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove album member',
      },
      { status: 500 }
    )
  }
}
