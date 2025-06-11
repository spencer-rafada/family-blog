import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Album } from '@/types'
import { SWRKeys } from '@/lib/constants'

export function useAlbums() {
  const { data, error, isLoading, mutate } = useSWR<Album[]>(
    SWRKeys.ALBUMS,
    fetcher
  )

  return {
    albums: data || [],
    error,
    isLoading,
    mutate,
  }
}

export function useAlbum(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Album>(
    id ? `/api/albums/${id}` : null,
    fetcher
  )

  return {
    album: data,
    error,
    isLoading,
    mutate,
  }
}