'use server'

import { createClient } from '@/lib/supabase/server'
import type { Comment } from '@/types'

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`)
  }

  return data || []
}

export async function createComment(postId: string, content: string): Promise<Comment> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to comment')
  }

  // Create comment
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      author:profiles(*)
    `)
    .single()

  if (commentError) {
    throw new Error(`Failed to create comment: ${commentError.message}`)
  }

  return comment
}

export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to edit comments')
  }

  // Update comment (RLS will ensure user can only edit their own comments)
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('author_id', user.id) // Extra safety check
    .select(`
      *,
      author:profiles(*)
    `)
    .single()

  if (commentError) {
    throw new Error(`Failed to update comment: ${commentError.message}`)
  }

  return comment
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to delete comments')
  }

  // Delete comment (RLS will ensure user can only delete their own comments)
  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id) // Extra safety check

  if (deleteError) {
    throw new Error(`Failed to delete comment: ${deleteError.message}`)
  }
}