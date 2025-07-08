import { NextRequest, NextResponse } from 'next/server'
import { acceptAlbumInvite } from '@/lib/actions/albums'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const albumId = await acceptAlbumInvite(params.token)
    return NextResponse.json({ albumId })
  } catch (error: unknown) {
    console.error('Error accepting album invite:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to accept album invite',
      },
      { status: 500 }
    )
  }
}
