import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { getAlbum } from '@/lib/actions/albums'
import { getCurrentUserRole, getUserPermissions } from '@/lib/permissions'
import AlbumSettings from '@/components/AlbumSettings'

export const metadata: Metadata = {
  title: 'Album Settings - Family Blog',
  description: 'Manage album settings, members, and permissions',
}

export default async function AlbumSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Get album and check permissions
  const album = await getAlbum(id)
  if (!album) {
    notFound()
  }

  const userRole = getCurrentUserRole(album, user.id)
  const permissions = getUserPermissions(userRole)

  // Only admins can access album settings
  if (!permissions.canEditAlbum) {
    redirect(`/albums/${id}`)
  }

  return <AlbumSettings albumId={id} />
}
