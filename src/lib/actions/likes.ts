'use server'

import { createClient } from '@/lib/supabase/server'
import type { PostLike } from '@/types'

export async function toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to like posts')
  }

  // Check if user already liked this post
  const { data: existingLike, error: checkError } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Failed to check like status: ${checkError.message}`)
  }

  if (existingLike) {
    // Unlike the post
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('id', existingLike.id)

    if (deleteError) {
      throw new Error(`Failed to unlike post: ${deleteError.message}`)
    }
  } else {
    // Like the post
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      })

    if (insertError) {
      throw new Error(`Failed to like post: ${insertError.message}`)
    }
  }

  // Get updated like count and user's like status
  const { data: likeData, error: countError } = await supabase
    .from('post_likes')
    .select('id, user_id')
    .eq('post_id', postId)

  if (countError) {
    throw new Error(`Failed to get like count: ${countError.message}`)
  }

  const likeCount = likeData.length
  const isLiked = likeData.some(like => like.user_id === user.id)

  return { isLiked, likeCount }
}

export async function getPostLikes(postId: string): Promise<{ likes: PostLike[]; likeCount: number; isLiked: boolean }> {
  const supabase = await createClient()
  
  // Get current user (may be null)
  const { data: { user } } = await supabase.auth.getUser()

  // Get all likes for this post
  const { data: likes, error } = await supabase
    .from('post_likes')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch likes: ${error.message}`)
  }

  const likeCount = likes.length
  const isLiked = user ? likes.some(like => like.user_id === user.id) : false

  return { likes: likes || [], likeCount, isLiked }
}