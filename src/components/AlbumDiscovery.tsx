'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Album } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Globe, Users, Calendar, Search } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { SWRKeys } from '@/lib/constants'

export default function AlbumDiscovery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [joiningAlbum, setJoiningAlbum] = useState<string | null>(null)

  const { data: albums = [], error, isLoading, mutate } = useSWR<Album[]>(
    SWRKeys.PUBLIC_ALBUMS,
    fetcher
  )

  const handleJoinRequest = async (albumId: string) => {
    setJoiningAlbum(albumId)
    try {
      const response = await fetch(`/api/albums/${albumId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'I would like to join this album' }),
      })

      if (response.ok) {
        alert('Join request sent! The album owner will review your request.')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send join request')
      }
    } catch (error) {
      console.error('Error sending join request:', error)
      alert('Failed to send join request')
    } finally {
      setJoiningAlbum(null)
    }
  }

  const filteredAlbums = albums.filter(album =>
    album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Failed to load public albums. Please try again later.
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading public albums...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Family Albums</h1>
          <p className="text-gray-600 mb-6">
            Browse public family albums and request to join
          </p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredAlbums.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No albums found' : 'No public albums yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Check back later for family albums to discover'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlbums.map((album) => (
              <Card key={album.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{album.name}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {album.description && (
                    <CardDescription className="line-clamp-2">
                      {album.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{album.member_count} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(album.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Created by {album.creator?.full_name || 'Unknown'}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinRequest(album.id)}
                      disabled={joiningAlbum === album.id}
                    >
                      {joiningAlbum === album.id ? 'Requesting...' : 'Request to Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}