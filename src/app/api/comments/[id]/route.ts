import { NextRequest, NextResponse } from 'next/server'
import { updateComment, deleteComment } from '@/lib/actions/comments'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { content } = await request.json()
    const commentId = (await params).id

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const comment = await updateComment(commentId, content)
    return NextResponse.json(comment)
  } catch (error: unknown) {
    console.error('Error in comment PATCH route:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update comment',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const commentId = (await params).id
    await deleteComment(commentId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error in comment DELETE route:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete comment',
      },
      { status: 500 }
    )
  }
}
