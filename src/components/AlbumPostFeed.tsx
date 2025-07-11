'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import PostSkeleton from './PostSkeleton'
import PostComments from './PostComments'
import LikeButton from './LikeButton'
import PostImages from './posts/PostImages'
import ImageLightbox from './posts/ImageLightbox'
import { fetcher } from '@/lib/fetcher'
import { MILESTONE_LABELS } from '@/lib/constants'
import type { Post } from '@/types'

interface AlbumPostFeedProps {
  albumId: string
}

export default function AlbumPostFeed({ albumId }: AlbumPostFeedProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<Post['post_images']>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const {
    data: posts,
    error,
    isLoading,
  } = useSWR<Post[]>(`/api/posts?album=${albumId}`, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000,
    dedupingInterval: 5000,
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
          <div className='space-y-4'>
            <ImageIcon className='w-12 h-12 text-gray-400 mx-auto' />
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                No posts yet
              </h3>
              <p className='text-gray-600 mt-1'>
                Be the first to share a memory in this album.
              </p>
            </div>
            <Button asChild className='w-full sm:w-auto'>
              <Link href={`/create?album=${albumId}`}>
                <Plus className='w-4 h-4 mr-2' />
                Add First Post
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {posts.map((post) => (
        <Card key={post.id} className='overflow-hidden'>
          <CardHeader className='pb-3'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center space-x-3'>
                <Avatar className='w-10 h-10 sm:w-9 sm:h-9'>
                  <AvatarImage src={post.author.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.author.full_name?.charAt(0) ||
                      post.author.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='font-medium text-sm truncate'>
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
                <Badge variant='secondary' className='self-start sm:self-auto'>
                  {MILESTONE_LABELS[post.milestone_type]}
                </Badge>
              )}
            </div>
            {post.title && (
              <h3 className='font-semibold text-base sm:text-lg mt-2'>{post.title}</h3>
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
