'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Settings, Globe, Lock, UserPlus, Crown } from 'lucide-react'
import { InviteModal } from '@/components/InviteModal'
import { MemberManagement } from '@/components/MemberManagement'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { getCurrentUserRole, getUserPermissions } from '@/lib/permissions'
import { fetcher } from '@/lib/fetcher'
import { Album, AlbumPrivacyLevel } from '@/types'
import { revalidateAlbums } from '@/lib/swr'

interface AlbumSettingsProps {
  albumId: string
}

export default function AlbumSettings({ albumId }: AlbumSettingsProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const { user } = useCurrentUser()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [privacyLevel, setPrivacyLevel] = useState<AlbumPrivacyLevel>(
    AlbumPrivacyLevel.PRIVATE
  )

  const {
    data: album,
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR<Album>(`/api/albums/${albumId}`, fetcher, {
    onSuccess: (data) => {
      if (data) {
        setName(data.name)
        setDescription(data.description || '')
        setPrivacyLevel(data.privacy_level)
      }
    },
  })

  // Get user permissions for this album
  const userRole = user ? getCurrentUserRole(album, user.id) : null
  const permissions = getUserPermissions(userRole)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!name.trim()) {
        setError('Album name is required')
        return
      }

      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          privacy_level: privacyLevel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update album')
      }

      // Revalidate albums list
      revalidateAlbums()
      setSuccess('Album updated successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update album')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete album')
      }

      revalidateAlbums()
      router.push('/albums')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete album')
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 max-w-4xl'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3' />
          <div className='h-32 bg-gray-200 rounded' />
          <div className='h-24 bg-gray-200 rounded' />
        </div>
      </div>
    )
  }

  if (fetchError || !album) {
    return (
      <div className='container mx-auto py-8 px-4 max-w-4xl'>
        <div className='text-center py-12'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Album not found
          </h2>
          <p className='text-gray-600 mb-4'>
            The album you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push('/albums')}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Albums
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-8'>
        <Button variant='ghost' onClick={() => router.push('/albums')}>
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Settings className='w-8 h-8' />
            Album Settings
          </h1>
          <p className='text-gray-600 mt-1'>
            Manage your album details and member permissions
          </p>
        </div>
      </div>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* Main Settings */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Album Details */}
          <Card>
            <CardHeader>
              <CardTitle>Album Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='album-name'>Album Name</Label>
                  <Input
                    id='album-name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Family Vacation 2024...'
                    disabled={saving}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='album-description'>Description</Label>
                  <Textarea
                    id='album-description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Share memories from our amazing trip...'
                    rows={3}
                    disabled={saving}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='album-privacy'>Privacy Level</Label>
                  <Select
                    value={privacyLevel}
                    onValueChange={(value: AlbumPrivacyLevel) =>
                      setPrivacyLevel(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AlbumPrivacyLevel.PRIVATE}>
                        <div className='flex items-center gap-2'>
                          <Lock className='h-4 w-4' />
                          <div>
                            <div className='font-medium'>Private</div>
                            <div className='text-xs text-gray-500'>
                              Invitation only
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={AlbumPrivacyLevel.PUBLIC}>
                        <div className='flex items-center gap-2'>
                          <Globe className='h-4 w-4' />
                          <div>
                            <div className='font-medium'>Public</div>
                            <div className='text-xs text-gray-500'>
                              Discoverable by others
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(error || success) && (
                  <div
                    className={`text-sm p-3 rounded ${
                      error
                        ? 'text-red-600 bg-red-50'
                        : 'text-green-600 bg-green-50'
                    }`}
                  >
                    {error || success}
                  </div>
                )}

                <div className='flex gap-3 pt-4'>
                  <Button type='submit' disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => router.push(`/albums/${albumId}`)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Delete Album */}
          <Card className='border-red-200'>
            <CardHeader>
              <CardTitle className='text-red-600'>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                Permanently delete this album and all its content. This action
                cannot be undone.
              </p>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant='destructive'>Delete Album</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Album</DialogTitle>
                  </DialogHeader>
                  <div className='py-4'>
                    <p className='text-sm text-gray-600'>
                      Are you sure you want to delete{' '}
                      <strong>{album.name}</strong>? This action cannot be
                      undone and will permanently remove:
                    </p>
                    <ul className='mt-3 text-sm text-gray-600 list-disc list-inside space-y-1'>
                      <li>All photos and posts in this album</li>
                      <li>All comments and likes</li>
                      <li>All member permissions and invitations</li>
                    </ul>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete Album'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Album Info */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Album Info</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-2'>
                {album.privacy_level === AlbumPrivacyLevel.PUBLIC ? (
                  <>
                    <Globe className='w-4 h-4 text-blue-500' />
                    <Badge variant='secondary'>Public</Badge>
                  </>
                ) : (
                  <>
                    <Lock className='w-4 h-4 text-gray-500' />
                    <Badge variant='outline'>Private</Badge>
                  </>
                )}
              </div>

              {album.is_default && (
                <div className='flex items-center gap-2'>
                  <Crown className='w-4 h-4 text-yellow-500' />
                  <Badge variant='outline'>Default Album</Badge>
                </div>
              )}

              <div className='text-sm text-gray-600'>
                <p>Created {new Date(album.created_at).toLocaleDateString()}</p>
                <p>{album.member_count} members</p>
                <p>{album.post_count || 0} posts</p>
              </div>
            </CardContent>
          </Card>

          {/* Members Preview (Mocked) */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center justify-between'>
                <span>Members</span>
                {permissions.canInviteMembers && (
                  <Button size='sm' onClick={() => setInviteModalOpen(true)}>
                    <UserPlus className='w-4 h-4 mr-2' />
                    Invite
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MemberManagement album={album} onUpdate={() => mutate()} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        albumId={albumId}
        albumName={album?.name || 'Album'}
        onInviteSuccess={() => mutate()}
      />
    </div>
  )
}
