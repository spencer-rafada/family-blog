import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost, deletePost } from '@/lib/actions/posts'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const post = await getPost((await params).id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json(post)
  } catch (error: unknown) {
    console.error('Error in post API route:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch post',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json()
    const post = await updatePost((await params).id, data)
    return NextResponse.json(post)
  } catch (error: unknown) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update post',
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
    await deletePost((await params).id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete post',
      },
      { status: 500 }
    )
  }
}
