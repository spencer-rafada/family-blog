'use client'

import { useState } from 'react'
import { createAlbumInvite } from '@/lib/actions/albums'
import { AlbumRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Crown, Edit3, Eye, UserPlus, Mail } from 'lucide-react'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  albumId: string
  albumName: string
  onInviteSuccess?: () => void
}

export function InviteModal({ isOpen, onClose, albumId, albumName, onInviteSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AlbumRole>(AlbumRole.VIEWER)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const roleOptions = [
    {
      value: AlbumRole.ADMIN,
      label: 'Admin',
      description: 'Can manage the album and invite others',
      icon: Crown,
      iconColor: 'text-yellow-500',
    },
    {
      value: AlbumRole.CONTRIBUTOR,
      label: 'Contributor', 
      description: 'Can add posts and memories',
      icon: Edit3,
      iconColor: 'text-green-500',
    },
    {
      value: AlbumRole.VIEWER,
      label: 'Viewer',
      description: 'Can view content only',
      icon: Eye,
      iconColor: 'text-gray-500',
    },
  ]

  const selectedRoleOption = roleOptions.find(option => option.value === role)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!email.trim()) {
        throw new Error('Email address is required')
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address')
      }

      await createAlbumInvite(albumId, email.trim(), role)
      
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      setRole(AlbumRole.VIEWER)
      
      // Call success callback after short delay to show success message
      setTimeout(() => {
        onInviteSuccess?.()
        handleClose()
      }, 1500)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole(AlbumRole.VIEWER)
    setError(null)
    setSuccess(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite to {albumName}
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join this album with specific permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address..."
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role & Permissions</Label>
            <Select value={role} onValueChange={(value: AlbumRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${option.iconColor}`} />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            
            {selectedRoleOption && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>{selectedRoleOption.label}:</strong> {selectedRoleOption.description}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              {success}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}