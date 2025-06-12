'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Settings, 
  Calendar,
  Lock,
  Globe,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { Album, AlbumPrivacyLevel } from '@/types'

interface AlbumCardProps {
  album: Album
  actions?: {
    onView?: () => void
    onEdit?: () => void
    onDelete?: () => void
    onManageMembers?: () => void
    onSettings?: () => void
    onJoin?: () => void
  }
  showActions?: boolean
  clickable?: boolean
  showMembers?: boolean
  showStats?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

export default function AlbumCard({ 
  album, 
  actions = {}, 
  showActions = true,
  clickable = true, 
  showMembers = true,
  showStats = true,
  variant = 'default'
}: AlbumCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    if (clickable) {
      if (actions.onView) {
        actions.onView()
      } else {
        router.push(`/albums/${album.id}`)
      }
    }
  }

  const privacyIcon = album.privacy_level === AlbumPrivacyLevel.PUBLIC ? (
    <Globe className="w-4 h-4 text-blue-500" />
  ) : (
    <Lock className="w-4 h-4 text-gray-500" />
  )

  const privacyBadge = album.privacy_level === AlbumPrivacyLevel.PUBLIC ? (
    <Badge variant="secondary" className="text-xs">
      <Globe className="w-3 h-3 mr-1" />
      Public
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs">
      <Lock className="w-3 h-3 mr-1" />
      Private
    </Badge>
  )

  return (
    <Card 
      className={`${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${
        variant === 'compact' ? 'h-auto' : ''
      }`}
      onClick={clickable ? handleCardClick : undefined}
    >
      <CardHeader className={variant === 'compact' ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`${variant === 'compact' ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              {privacyIcon}
              {album.name}
              {album.is_default && (
                <Badge variant="outline" className="text-xs">
                  Default
                </Badge>
              )}
            </CardTitle>
            {album.description && variant !== 'compact' && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {album.description}
              </p>
            )}
            {variant === 'detailed' && (
              <div className="flex items-center gap-2 mt-2">
                {privacyBadge}
              </div>
            )}
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.onSettings && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    actions.onSettings?.()
                  }}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                )}
                {actions.onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    actions.onEdit?.()
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Album
                  </DropdownMenuItem>
                )}
                {actions.onManageMembers && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    actions.onManageMembers?.()
                  }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Manage Members
                  </DropdownMenuItem>
                )}
                {actions.onJoin && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    actions.onJoin?.()
                  }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Request to Join
                  </DropdownMenuItem>
                )}
                {(actions.onEdit || actions.onManageMembers) && actions.onDelete && (
                  <DropdownMenuSeparator />
                )}
                {actions.onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.onDelete?.()
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Album
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      {variant !== 'compact' && (
        <CardContent className="space-y-3">
          {/* Members preview */}
          {showMembers && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {album.member_count} {album.member_count === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          )}

          {/* Member avatars */}
          {showMembers && album.members && album.members.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-2">
                {album.members.slice(0, 4).map((member) => (
                  <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={member.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.user?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {album.members.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600">
                      +{album.members.length - 4}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Album stats */}
          {showStats && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>
                  Created {formatDistanceToNow(new Date(album.created_at), { addSuffix: true })}
                </span>
              </div>
              {album.post_count !== undefined && (
                <span>{album.post_count} posts</span>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}