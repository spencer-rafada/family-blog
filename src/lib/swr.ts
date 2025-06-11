import { mutate } from 'swr'
import { SWRKeys } from './constants'

// Centralized SWR revalidation functions
export const revalidatePosts = () => mutate(SWRKeys.POSTS)
export const revalidateProfile = () => mutate(SWRKeys.PROFILE)
export const revalidateComments = (postId: string) => mutate(`${SWRKeys.COMMENTS}?postId=${postId}`)
export const revalidateLikes = (postId: string) => mutate(`${SWRKeys.LIKES}?postId=${postId}`)
export const revalidateAlbums = () => mutate(SWRKeys.ALBUMS)
export const revalidateAlbumMembers = (albumId: string) => mutate(`${SWRKeys.ALBUM_MEMBERS}?albumId=${albumId}`)
export const revalidateAlbumInvites = (albumId: string) => mutate(`${SWRKeys.ALBUM_INVITES}?albumId=${albumId}`)

// Revalidate all data (useful for sign out, etc.)
export const revalidateAll = () => {
  revalidatePosts()
  revalidateProfile()
  revalidateAlbums()
}