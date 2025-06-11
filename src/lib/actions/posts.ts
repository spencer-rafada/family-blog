'use server'

import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/types'

export async function getPosts(): Promise<Post[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles(*),
      post_images(*)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`)
  }

  // Sort images by display_order
  return data.map((post) => ({
    ...post,
    post_images: post.post_images.sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
  }))
}
