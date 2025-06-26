'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { 
  getAlbumInvites, 
  cancelAlbumInvite, 
  updateAlbumMemberRole, 
  removeAlbumMember 
} from '@/lib/actions/albums'
import { fetcher } from '@/lib/fetcher'
import { Album, AlbumRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Crown, 
  Edit3, 
  Eye, 
  MoreHorizontal, 
  UserMinus, 
  X, 
  Clock,
  Mail
} from 'lucide-react'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { getCurrentUserRole, getUserPermissions } from '@/lib/permissions'

interface MemberManagementProps {
  album: Album
  onUpdate: () => void
}

export function MemberManagement({ album, onUpdate }: MemberManagementProps) {
  const { user } = useCurrentUser()
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [cancelingInvite, setCancelingInvite] = useState<string | null>(null)

  // Get user permissions
  const userRole = user ? getCurrentUserRole(album, user.id) : null
  const permissions = getUserPermissions(userRole)

  // Fetch pending invites
  const { data: invites, mutate: mutateInvites } = useSWR(
    permissions.canManageMembers ? `/invites/${album.id}` : null,
    () => getAlbumInvites(album.id)
  )

  const handleRoleChange = async (memberId: string, newRole: AlbumRole) => {
    if (!permissions.canManageMembers) return
    
    setUpdatingRole(memberId)
    try {
      await updateAlbumMemberRole(memberId, newRole)
      onUpdate()
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!permissions.canManageMembers) return
    
    setRemovingMember(null)
    try {
      await removeAlbumMember(memberId)
      onUpdate()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    setCancelingInvite(inviteId)
    try {
      await cancelAlbumInvite(inviteId)
      mutateInvites()
    } catch (error) {
      console.error('Failed to cancel invite:', error)
    } finally {
      setCancelingInvite(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3 text-yellow-500" />
      case 'contributor': return <Edit3 className="w-3 h-3 text-green-500" />
      case 'viewer': return <Eye className="w-3 h-3 text-gray-500" />
      default: return null
    }
  }

  const isAlbumOwner = (memberId: string) => {
    const member = album.members?.find(m => m.id === memberId)
    return member?.user_id === album.created_by
  }

  const canManageMember = (memberId: string) => {
    return permissions.canManageMembers && !isAlbumOwner(memberId) && 
           album.members?.find(m => m.id === memberId)?.user_id !== user?.id
  }

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-700">Active Members</h4>
        {album.members && album.members.length > 0 ? (
          album.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.user?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.user?.full_name || 'Unknown'}
                    {isAlbumOwner(member.id) && (
                      <Badge variant="outline" className="ml-2 text-xs">Owner</Badge>
                    )}
                  </p>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(member.role)}
                    <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                  </div>
                </div>
              </div>
              
              {canManageMember(member.id) && (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value: AlbumRole) => handleRoleChange(member.id, value)}
                    disabled={updatingRole === member.id}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AlbumRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={AlbumRole.CONTRIBUTOR}>Contributor</SelectItem>
                      <SelectItem value={AlbumRole.VIEWER}>Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemovingMember(member.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <UserMinus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No members yet</p>
        )}
      </div>

      {/* Pending Invites */}
      {permissions.canManageMembers && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Pending Invites</h4>
            {invites && invites.length > 0 ? (
              invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {invite.email}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Invited by {invite.inviter?.full_name || 'Unknown'}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(invite.role)}
                          <span className="capitalize">{invite.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvite(invite.id)}
                    disabled={cancelingInvite === invite.id}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No pending invites</p>
            )}
          </div>
        </>
      )}

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the album? They will lose access to all content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => removingMember && handleRemoveMember(removingMember)}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}