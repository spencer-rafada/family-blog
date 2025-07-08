'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/supabase/storage'
import { useAlbums } from '@/lib/hooks/useAlbums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Upload, Users } from 'lucide-react'
import Image from 'next/image'

interface ImageUpload {
  file: File
  preview: string
  caption?: string
}

interface CreatePostFormProps {
  preselectedAlbumId?: string
}

export default function CreatePostForm({
  preselectedAlbumId,
}: CreatePostFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [milestoneType, setMilestoneType] = useState('')
  const [selectedAlbumId, setSelectedAlbumId] = useState(
    preselectedAlbumId || ''
  )
  const [images, setImages] = useState<ImageUpload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { albums, isLoading: albumsLoading } = useAlbums()

  // Set album from preselected prop when albums load
  useEffect(() => {
    if (preselectedAlbumId && albums.length > 0) {
      const albumExists = albums.find(
        (album) => album.id === preselectedAlbumId
      )
      if (albumExists) {
        setSelectedAlbumId(preselectedAlbumId)
      }
    }
  }, [preselectedAlbumId, albums])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file)
        setImages((prev) => [...prev, { file, preview }])
      }
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateImageCaption = (index: number, caption: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption } : img))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!selectedAlbumId) {
        setError('Please select an album for this post')
        return
      }

      // Create post using the API
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || undefined,
          content,
          milestone_type: milestoneType || undefined,
          album_id: selectedAlbumId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      const post = await response.json()

      // Upload images and create post_images records
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const imageUrl = await uploadImage(image.file)

        if (imageUrl) {
          await supabase.from('post_images').insert({
            post_id: post.id,
            image_url: imageUrl,
            caption: image.caption || null,
            display_order: i,
          })
        }
      }

      // Trigger SWR revalidation to show new post immediately
      const { revalidatePosts } = await import('@/lib/swr')
      revalidatePosts()

      // Navigate back to album if we came from one, otherwise to home
      if (preselectedAlbumId) {
        router.push(`/albums/${preselectedAlbumId}`)
      } else {
        router.push('/home')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  // Get selected album info for display
  const selectedAlbum = selectedAlbumId
    ? albums.find((a) => a.id === selectedAlbumId)
    : null

  return (
    <div className='container mx-auto py-8 px-4 max-w-2xl'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>
            {preselectedAlbumId
              ? `Add Post to ${selectedAlbum?.name || 'Album'}`
              : 'Share a New Memory'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title (Optional)</Label>
              <Input
                id='title'
                placeholder='Give this memory a title...'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='content'>What happened?</Label>
              <Textarea
                id='content'
                placeholder='Tell us about this moment...'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='album'>Share to Album</Label>
              <Select
                value={selectedAlbumId}
                onValueChange={setSelectedAlbumId}
                required
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      albumsLoading ? 'Loading albums...' : 'Select an album'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      <div className='flex items-center space-x-2'>
                        <Users className='w-4 h-4' />
                        <span>{album.name}</span>
                        <Badge variant='outline' className='text-xs'>
                          {album.member_count}{' '}
                          {album.member_count === 1 ? 'member' : 'members'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAlbumId && (
                <div className='text-sm text-gray-500'>
                  Your post will be shared with all members of this album
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <Label>Photos</Label>

              {/* Image Upload */}
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                <input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={handleImageSelect}
                  className='hidden'
                  id='image-upload'
                />
                <label
                  htmlFor='image-upload'
                  className='cursor-pointer flex flex-col items-center space-y-2'
                >
                  <Upload className='w-8 h-8 text-gray-400' />
                  <span className='text-sm text-gray-600'>
                    Click to upload photos
                  </span>
                </label>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className='grid grid-cols-1 gap-4'>
                  {images.map((image, index) => (
                    <div key={index} className='relative border rounded-lg p-4'>
                      <div className='flex items-start space-x-4'>
                        <div className='relative flex-shrink-0'>
                          <Image
                            src={image.preview}
                            alt={`Upload ${index + 1}`}
                            width={500}
                            height={500}
                            className='w-20 h-20 object-cover rounded'
                          />
                          <Button
                            type='button'
                            variant='destructive'
                            size='sm'
                            className='absolute -top-2 -right-2 w-6 h-6 p-0'
                            onClick={() => removeImage(index)}
                          >
                            <X className='w-3 h-3' />
                          </Button>
                        </div>
                        <div className='flex-1'>
                          <Input
                            placeholder='Add a caption (optional)...'
                            value={image.caption || ''}
                            onChange={(e) =>
                              updateImageCaption(index, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Milestone Section */}
            <div className='space-y-2 border-t pt-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='milestone' className='text-sm text-gray-600'>
                  Milestone (Optional)
                </Label>
                {milestoneType && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setMilestoneType('')}
                    className='text-xs'
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Select value={milestoneType} onValueChange={setMilestoneType}>
                <SelectTrigger>
                  <SelectValue placeholder='Mark as special milestone?' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='first_steps'>First Steps</SelectItem>
                  <SelectItem value='first_words'>First Words</SelectItem>
                  <SelectItem value='birthday'>Birthday</SelectItem>
                  <SelectItem value='holiday'>Holiday</SelectItem>
                  <SelectItem value='general'>General</SelectItem>
                </SelectContent>
              </Select>
              {milestoneType && (
                <Badge variant='secondary' className='capitalize'>
                  {milestoneType.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {error && (
              <div className='text-red-600 text-sm bg-red-50 p-3 rounded'>
                {error}
              </div>
            )}

            <div className='flex space-x-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  if (preselectedAlbumId) {
                    router.push(`/albums/${preselectedAlbumId}`)
                  } else {
                    router.push('/home')
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  loading ||
                  (!content.trim() && images.length === 0) ||
                  !selectedAlbumId
                }
              >
                {loading ? 'Sharing...' : 'Share Memory'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
