// SWR Keys
export enum SWRKeys {
  POSTS = '/api/posts',
  PROFILE = '/api/profile',
  COMMENTS = '/api/comments',
  LIKES = '/api/likes',
  ALBUMS = '/api/albums',
  PUBLIC_ALBUMS = '/api/albums/public',
  ALBUM_MEMBERS = '/api/albums/members',
  ALBUM_INVITES = '/api/albums/invites',
}

// Milestone Types
export enum MilestoneType {
  FIRST_STEPS = 'first_steps',
  FIRST_WORDS = 'first_words',
  BIRTHDAY = 'birthday',
  HOLIDAY = 'holiday',
  GENERAL = 'general',
}

// Milestone Display Names
export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  [MilestoneType.FIRST_STEPS]: 'First Steps',
  [MilestoneType.FIRST_WORDS]: 'First Words',
  [MilestoneType.BIRTHDAY]: 'Birthday',
  [MilestoneType.HOLIDAY]: 'Holiday',
  [MilestoneType.GENERAL]: 'General',
}

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}