import { NextRequest, NextResponse } from 'next/server'
import { cancelAlbumInvite } from '@/lib/actions/albums'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  try {
    await cancelAlbumInvite(params.inviteId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error canceling album invite:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to cancel album invite',
      },
      { status: 500 }
    )
  }
}
