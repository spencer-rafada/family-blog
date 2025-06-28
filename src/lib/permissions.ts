import { AlbumRole } from '@/types'

export interface UserPermissions {
  canInviteMembers: boolean
  canManageMembers: boolean
  canEditAlbum: boolean
  canDeleteAlbum: boolean
  canCreatePosts: boolean
  canDeleteOthersPosts: boolean
}

/**
 * Get user permissions based on their role in an album
 */
export function getUserPermissions(userRole: AlbumRole | null): UserPermissions {
  if (!userRole) {
    return {
      canInviteMembers: false,
      canManageMembers: false,
      canEditAlbum: false,
      canDeleteAlbum: false,
      canCreatePosts: false,
      canDeleteOthersPosts: false,
    }
  }

  switch (userRole) {
    case AlbumRole.ADMIN:
      return {
        canInviteMembers: true,
        canManageMembers: true,
        canEditAlbum: true,
        canDeleteAlbum: true,
        canCreatePosts: true,
        canDeleteOthersPosts: true,
      }

    case AlbumRole.CONTRIBUTOR:
      return {
        canInviteMembers: false,
        canManageMembers: false,
        canEditAlbum: false,
        canDeleteAlbum: false,
        canCreatePosts: true,
        canDeleteOthersPosts: false,
      }

    case AlbumRole.VIEWER:
      return {
        canInviteMembers: false,
        canManageMembers: false,
        canEditAlbum: false,
        canDeleteAlbum: false,
        canCreatePosts: false,
        canDeleteOthersPosts: false,
      }

    default:
      return {
        canInviteMembers: false,
        canManageMembers: false,
        canEditAlbum: false,
        canDeleteAlbum: false,
        canCreatePosts: false,
        canDeleteOthersPosts: false,
      }
  }
}

/**
 * Get current user's role in an album from album data
 */
export function getCurrentUserRole(album: any, currentUserId: string): AlbumRole | null {
  if (!album || !currentUserId) return null

  // Check if user is the album creator (always admin)
  if (album.created_by === currentUserId) {
    return AlbumRole.ADMIN
  }

  // Check user's role in album members
  const userMembership = album.members?.find((member: any) => member.user_id === currentUserId)
  
  if (userMembership) {
    return userMembership.role as AlbumRole
  }

  return null
}