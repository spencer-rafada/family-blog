import { MilestoneType, UserRole } from '@/lib/constants'

export interface PostImage {
  id: string
  image_url: string
  caption: string | null
  display_order: number
}

export interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole
  is_invited: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string | null
  content: string
  milestone_type: MilestoneType | null
  created_at: string
  updated_at: string
  author_id: string
  author: Profile
  post_images: PostImage[]
}