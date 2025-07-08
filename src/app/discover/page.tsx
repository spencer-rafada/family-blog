import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AlbumDiscovery from '@/components/AlbumDiscovery'
import { discoverFlag } from '@/lib/flags'

export const metadata: Metadata = {
  title: 'Discover Albums - Family Blog',
  description: 'Browse and join public family albums',
}

export default async function DiscoverPage() {
  const isDiscoverEnabled = await discoverFlag()
  
  if (!isDiscoverEnabled) {
    notFound()
  }
  
  return <AlbumDiscovery />
}