import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/lib/actions/posts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('album') || searchParams.get('albumId') || undefined
    
    const posts = await getPosts(albumId)
    return NextResponse.json(posts)
  } catch (error: any) {
    console.error('Error in posts API route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const post = await createPost(data)
    return NextResponse.json(post)
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    )
  }
}