import { NextRequest, NextResponse } from 'next/server'
import { requestToJoinAlbum } from '@/lib/actions/albums'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json()
    const invite = await requestToJoinAlbum(params.id, message)
    return NextResponse.json(invite)
  } catch (error: unknown) {
    console.error('Error requesting to join album:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request album access' },
      { status: 500 }
    )
  }
}