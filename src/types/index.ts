import { MilestoneType } from '@/lib/constants'

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
  is_invited: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author: Profile
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Album {
  id: string
  name: string
  description: string | null
  created_by: string
  is_default: boolean
  privacy_level: AlbumPrivacyLevel
  created_at: string
  updated_at: string
  creator?: Profile
  members?: AlbumMember[]
  member_count?: number
  post_count?: number
}

export interface AlbumMember {
  id: string
  album_id: string
  user_id: string
  role: AlbumRole
  joined_at: string
  user?: Profile
}

export interface AlbumInvite {
  id: string
  album_id: string
  email: string
  invited_by: string
  role: AlbumRole
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
  is_shareable?: boolean
  max_uses?: number | null
  uses_count?: number
  album?: Album
  inviter?: Profile
}

export enum AlbumRole {
  ADMIN = 'admin',
  CONTRIBUTOR = 'contributor',
  VIEWER = 'viewer',
}

export enum AlbumPrivacyLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface Post {
  id: string
  title: string | null
  content: string
  milestone_type: MilestoneType | null
  album_id: string | null
  created_at: string
  updated_at: string
  author_id: string
  author: Profile
  album?: Album
  post_images: PostImage[]
  comments?: Comment[]
  likes?: PostLike[]
  like_count?: number
  is_liked?: boolean
}