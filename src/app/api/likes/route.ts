import { NextRequest, NextResponse } from 'next/server'
import { toggleLike, getPostLikes } from '@/lib/actions/likes'

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

    const { likes, likeCount, isLiked } = await getPostLikes(postId)
    return NextResponse.json({ likes, likeCount, isLiked })
  } catch (error: any) {
    console.error('Error in likes GET route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const { isLiked, likeCount } = await toggleLike(postId)
    return NextResponse.json({ isLiked, likeCount })
  } catch (error: any) {
    console.error('Error in likes POST route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' },
      { status: 500 }
    )
  }
}