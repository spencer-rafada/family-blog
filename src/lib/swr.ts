import { mutate } from 'swr'
import { SWRKeys } from './constants'

// Centralized SWR revalidation functions
export const revalidatePosts = () => mutate(SWRKeys.POSTS)
export const revalidateProfile = () => mutate(SWRKeys.PROFILE)
export const revalidateComments = (postId: string) => mutate(`${SWRKeys.COMMENTS}?postId=${postId}`)
export const revalidateLikes = (postId: string) => mutate(`${SWRKeys.LIKES}?postId=${postId}`)

// Revalidate all data (useful for sign out, etc.)
export const revalidateAll = () => {
  revalidatePosts()
  revalidateProfile()
}