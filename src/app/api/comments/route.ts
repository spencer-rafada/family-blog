import { NextRequest, NextResponse } from 'next/server'
import { createComment, getCommentsByPostId } from '@/lib/actions/comments'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const comments = await getCommentsByPostId(postId)
    return NextResponse.json(comments)
  } catch (error: any) {
    console.error('Error in comments GET route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, content } = await request.json()

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      )
    }

    const comment = await createComment(postId, content)
    return NextResponse.json(comment)
  } catch (error: any) {
    console.error('Error in comments POST route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}