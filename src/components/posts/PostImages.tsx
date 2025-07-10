'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import type { PostImage } from '@/types'

interface PostImagesProps {
  images: PostImage[]
  onImageClick?: (index: number) => void
}

export default function PostImages({ images, onImageClick }: PostImagesProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <div className="relative w-full">
        <div
          className="relative cursor-pointer overflow-hidden rounded-lg"
          onClick={() => onImageClick?.(0)}
        >
          <Image
            src={images[0].image_url}
            alt={images[0].caption || 'Post image'}
            width={800}
            height={600}
            className="w-full h-auto max-h-[600px] object-cover"
            priority
          />
        </div>
        {images[0].caption && (
          <p className="mt-2 text-sm text-gray-600 italic">{images[0].caption}</p>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <Carousel
        setApi={setApi}
        className="relative w-full"
        opts={{
          align: 'start',
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem key={image.id} className="pl-2 md:pl-4">
              <div
                className="relative cursor-pointer overflow-hidden rounded-lg"
                onClick={() => onImageClick?.(index)}
              >
                <Image
                  src={image.image_url}
                  alt={image.caption || `Post image ${index + 1}`}
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[600px] object-cover"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>

      {/* Carousel indicators */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                current === index
                  ? 'bg-gray-800 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Current image caption */}
      {images[current]?.caption && (
        <p className="mt-2 text-sm text-gray-600 italic text-center">
          {images[current].caption}
        </p>
      )}
    </div>
  )
}