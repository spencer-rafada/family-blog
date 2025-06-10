import { mutate } from 'swr'
import { SWRKeys } from './constants'

// Centralized SWR revalidation functions
export const revalidatePosts = () => mutate(SWRKeys.POSTS)
export const revalidateProfile = () => mutate(SWRKeys.PROFILE)

// Revalidate all data (useful for sign out, etc.)
export const revalidateAll = () => {
  revalidatePosts()
  revalidateProfile()
}