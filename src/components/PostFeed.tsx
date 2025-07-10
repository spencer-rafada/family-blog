'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import PostSkeleton from './PostSkeleton'
import PostComments from './PostComments'
import LikeButton from './LikeButton'
import PostImages from './posts/PostImages'
import ImageLightbox from './posts/ImageLightbox'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys, MILESTONE_LABELS } from '@/lib/constants'
import type { Post } from '@/types'
import { Users } from 'lucide-react'

export default function PostFeed() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<Post['post_images']>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const {
    data: posts,
    error,
    isLoading,
  } = useSWR<Post[]>(SWRKeys.POSTS, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // Refresh every 30 seconds
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
  })

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className='text-center py-8'>
        <CardContent>
          <p className='text-red-600'>Error loading posts: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className='text-center py-12'>
        <CardContent>
          <p className='text-gray-600 mb-4'>No memories shared yet!</p>
          <p className='text-sm text-gray-500'>
            Be the first to share a special moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {posts.map((post) => (
        <Card key={post.id} className='overflow-hidden'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <Avatar>
                  <AvatarImage src={post.author.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.author.full_name?.charAt(0) ||
                      post.author.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium text-sm'>
                    {post.author.full_name || post.author.email}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              {post.milestone_type && (
                <Badge variant='secondary'>
                  {MILESTONE_LABELS[post.milestone_type]}
                </Badge>
              )}
            </div>
            {post.title && (
              <h3 className='font-semibold text-lg mt-2'>{post.title}</h3>
            )}
            {post.album && (
              <div className='mt-2'>
                <Link
                  href={`/albums/${post.album.id}`}
                  className='inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800'
                >
                  <Users className='w-3 h-3' />
                  {post.album.name}
                </Link>
              </div>
            )}
          </CardHeader>

          <CardContent className='space-y-4'>
            <p className='text-gray-700 whitespace-pre-wrap'>{post.content}</p>

            {post.post_images.length > 0 && (
              <PostImages
                images={post.post_images}
                onImageClick={(index) => {
                  setLightboxImages(post.post_images)
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
              />
            )}

            {/* Like Button */}
            <div className='flex items-center pt-2 border-t'>
              <LikeButton postId={post.id} />
            </div>

            {/* Comments Section */}
            <PostComments postId={post.id} />
          </CardContent>
        </Card>
      ))}

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}
