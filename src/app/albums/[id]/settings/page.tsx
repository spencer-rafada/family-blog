import { Metadata } from 'next'
import AlbumSettings from '@/components/AlbumSettings'

export const metadata: Metadata = {
  title: 'Album Settings - Family Blog',
  description: 'Manage album settings, members, and permissions',
}

export default function AlbumSettingsPage({ params }: { params: { id: string } }) {
  return <AlbumSettings albumId={params.id} />
}