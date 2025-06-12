'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Globe, Lock } from 'lucide-react'
import { revalidateAlbums } from '@/lib/swr'
import { AlbumPrivacyLevel } from '@/types'

interface CreateAlbumCardProps {
  onSuccess?: (albumId: string) => void
}

export default function CreateAlbumCard({ onSuccess }: CreateAlbumCardProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [privacyLevel, setPrivacyLevel] = useState<AlbumPrivacyLevel>(AlbumPrivacyLevel.PRIVATE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrivacyLevel(AlbumPrivacyLevel.PRIVATE)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!name.trim()) {
        setError('Album name is required')
        return
      }

      const response = await fetch('/api/albums', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Failed to create album')
      }

      const album = await response.json()

      // Revalidate albums list
      revalidateAlbums()
      
      resetForm()
      
      if (onSuccess) {
        onSuccess(album.id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create album')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Create New Album
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album-name">Album Name</Label>
            <Input
              id="album-name"
              placeholder="Family Vacation 2024..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album-description">Description (Optional)</Label>
            <Textarea
              id="album-description"
              placeholder="Share memories from our amazing trip..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album-privacy">Privacy Level</Label>
            <Select value={privacyLevel} onValueChange={(value: AlbumPrivacyLevel) => setPrivacyLevel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AlbumPrivacyLevel.PRIVATE}>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-gray-500">Invitation only</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={AlbumPrivacyLevel.PUBLIC}>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-gray-500">Discoverable by others</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Album'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}