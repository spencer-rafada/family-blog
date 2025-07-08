'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'
import type { Post, PostImage } from '@/types'
import { MilestoneType } from '../constants'

export async function getPosts(albumId?: string): Promise<Post[]> {
  const supabase = await createClient()

  let query = supabase.from('posts').select(
    `
      *,
      author:profiles(*),
      album:albums(id, name),
      post_images(*)
    `
  )

  // Filter by album if specified
  if (albumId) {
    query = query.eq('album_id', albumId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`)
  }

  // Sort images by display_order
  return data.map((post) => ({
    ...post,
    post_images: post.post_images.sort(
      (a: PostImage, b: PostImage) => a.display_order - b.display_order
    ),
  }))
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles(*),
      album:albums(id, name),
      post_images(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Post not found
    }
    throw new Error(`Failed to fetch post: ${error.message}`)
  }

  return {
    ...post,
    post_images: post.post_images.sort(
      (a: PostImage, b: PostImage) => a.display_order - b.display_order
    ),
  }
}

export async function createPost(data: {
  title?: string
  content: string
  milestone_type?: MilestoneType
  album_id: string
}): Promise<Post> {
  const user = await requireAuth()
  const supabase = await createClient()

  if (!data.content?.trim()) {
    throw new Error('Post content is required')
  }

  if (!data.album_id) {
    throw new Error('Album ID is required')
  }

  // Check user permissions for this album
  const { getAlbum } = await import('./albums')
  const { getCurrentUserRole, getUserPermissions } = await import(
    '@/lib/permissions'
  )

  const album = await getAlbum(data.album_id)
  if (!album) {
    throw new Error('Album not found')
  }

  const userRole = getCurrentUserRole(album, user.id)
  const permissions = getUserPermissions(userRole)

  if (!permissions.canCreatePosts) {
    throw new Error('You do not have permission to create posts in this album')
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title: data.title?.trim() || null,
      content: data.content.trim(),
      milestone_type: data.milestone_type || null,
      album_id: data.album_id,
    })
    .select(
      `
      *,
      author:profiles(*),
      album:albums(id, name),
      post_images(*)
    `
    )
    .single()

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`)
  }

  return post
}

export async function updatePost(
  id: string,
  data: {
    title?: string
    content: string
    milestone_type?: MilestoneType
  }
): Promise<Post> {
  const user = await requireAuth()
  const supabase = await createClient()

  if (!data.content?.trim()) {
    throw new Error('Post content is required')
  }

  // Get the post to check ownership and album permissions
  const existingPost = await getPost(id)
  if (!existingPost) {
    throw new Error('Post not found')
  }

  // Check if user is the author or has admin permissions
  const isAuthor = existingPost.author_id === user.id

  if (existingPost.album_id) {
    const { getAlbum } = await import('./albums')
    const { getCurrentUserRole, getUserPermissions } = await import(
      '@/lib/permissions'
    )

    const album = await getAlbum(existingPost.album_id)
    if (album) {
      const userRole = getCurrentUserRole(album, user.id)
      const permissions = getUserPermissions(userRole)

      if (!isAuthor && !permissions.canDeleteOthersPosts) {
        throw new Error('You do not have permission to edit this post')
      }
    }
  } else if (!isAuthor) {
    throw new Error('You can only edit your own posts')
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update({
      title: data.title?.trim() || null,
      content: data.content.trim(),
      milestone_type: data.milestone_type || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      `
      *,
      author:profiles(*),
      album:albums(id, name),
      post_images(*)
    `
    )
    .single()

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`)
  }

  return {
    ...post,
    post_images: post.post_images.sort(
      (a: PostImage, b: PostImage) => a.display_order - b.display_order
    ),
  }
}

export async function deletePost(id: string): Promise<void> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get the post to check ownership and album permissions
  const existingPost = await getPost(id)
  if (!existingPost) {
    throw new Error('Post not found')
  }

  // Check if user is the author or has admin permissions
  const isAuthor = existingPost.author_id === user.id

  if (existingPost.album_id) {
    const { getAlbum } = await import('./albums')
    const { getCurrentUserRole, getUserPermissions } = await import(
      '@/lib/permissions'
    )

    const album = await getAlbum(existingPost.album_id)
    if (album) {
      const userRole = getCurrentUserRole(album, user.id)
      const permissions = getUserPermissions(userRole)

      if (!isAuthor && !permissions.canDeleteOthersPosts) {
        throw new Error('You do not have permission to delete this post')
      }
    }
  } else if (!isAuthor) {
    throw new Error('You can only delete your own posts')
  }

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`)
  }
}
