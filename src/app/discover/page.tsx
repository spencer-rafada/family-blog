import { Metadata } from 'next'
import AlbumDiscovery from '@/components/AlbumDiscovery'

export const metadata: Metadata = {
  title: 'Discover Albums - Family Blog',
  description: 'Browse and join public family albums',
}

export default function DiscoverPage() {
  return <AlbumDiscovery />
}