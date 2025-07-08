'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'
import {
  Album,
  AlbumMember,
  AlbumInvite,
  AlbumRole,
  AlbumPrivacyLevel,
} from '@/types'

export async function getAlbums(): Promise<Album[]> {
  const supabase = await createClient()

  const { data: albums, error } = await supabase
    .from('albums')
    .select(
      `
      *,
      creator:profiles!albums_created_by_fkey(id, full_name, avatar_url),
      members:album_members(
        id,
        user_id,
        role,
        joined_at,
        user:profiles(id, full_name, avatar_url)
      ),
      posts(id)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch albums: ${error.message}`)
  }

  return albums.map((album) => ({
    ...album,
    member_count: album.members?.length || 0,
    post_count: album.posts?.length || 0,
  }))
}

export async function getPublicAlbums(): Promise<Album[]> {
  const supabase = await createClient()

  const { data: albums, error } = await supabase
    .from('albums')
    .select(
      `
      *,
      creator:profiles!albums_created_by_fkey(id, full_name, avatar_url),
      members:album_members(
        id,
        user_id,
        role,
        joined_at,
        user:profiles(id, full_name, avatar_url)
      ),
      posts(id)
    `
    )
    .eq('privacy_level', AlbumPrivacyLevel.PUBLIC)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch public albums: ${error.message}`)
  }

  return albums.map((album) => ({
    ...album,
    member_count: album.members?.length || 0,
    post_count: album.posts?.length || 0,
  }))
}

export async function getAlbum(id: string): Promise<Album | null> {
  const supabase = await createClient()

  const { data: album, error } = await supabase
    .from('albums')
    .select(
      `
      *,
      creator:profiles!albums_created_by_fkey(id, full_name, avatar_url),
      members:album_members(
        id,
        user_id,
        role,
        joined_at,
        user:profiles(id, full_name, avatar_url)
      ),
      posts(id)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Album not found
    }
    throw new Error(`Failed to fetch album: ${error.message}`)
  }

  return {
    ...album,
    member_count: album.members?.length || 0,
    post_count: album.posts?.length || 0,
  }
}

export async function createAlbum(data: {
  name: string
  description?: string
  privacy_level?: AlbumPrivacyLevel
}): Promise<Album> {
  const user = await requireAuth()
  const supabase = await createClient()

  if (!data.name?.trim()) {
    throw new Error('Album name is required')
  }

  const insertData = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    created_by: user.id,
    is_default: false,
    privacy_level: data.privacy_level || AlbumPrivacyLevel.PRIVATE,
  }

  // Use RPC call to bypass RLS for album creation
  const { data: album, error } = await supabase.rpc(
    'create_album_with_member',
    {
      album_name: insertData.name,
      album_description: insertData.description,
      album_privacy_level: insertData.privacy_level,
      creator_id: user.id,
    }
  )

  if (error) {
    throw new Error(`Failed to create album: ${error.message}`)
  }

  return album
}

export async function updateAlbum(
  id: string,
  data: {
    name: string
    description?: string
    privacy_level?: AlbumPrivacyLevel
  }
): Promise<Album> {
  await requireAuth()
  const supabase = await createClient()

  if (!data.name?.trim()) {
    throw new Error('Album name is required')
  }

  const updateData: Partial<Album> = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  // Only update privacy_level if it's provided
  if (data.privacy_level) {
    updateData.privacy_level = data.privacy_level
  }

  const { data: album, error } = await supabase
    .from('albums')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update album: ${error.message}`)
  }

  return album
}

export async function deleteAlbum(id: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from('albums').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete album: ${error.message}`)
  }
}

export async function getAlbumMembers(albumId: string): Promise<AlbumMember[]> {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('album_members')
    .select(
      `
      *,
      user:profiles(id, full_name, avatar_url, email)
    `
    )
    .eq('album_id', albumId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch album members: ${error.message}`)
  }

  return members
}

export async function addAlbumMember(
  albumId: string,
  userId: string,
  role: AlbumRole
): Promise<AlbumMember> {
  await requireAuth()
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('album_members')
    .insert({
      album_id: albumId,
      user_id: userId,
      role: role,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add album member: ${error.message}`)
  }

  return member
}

export async function updateAlbumMemberRole(
  memberId: string,
  role: AlbumRole
): Promise<AlbumMember> {
  await requireAuth()
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('album_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update member role: ${error.message}`)
  }

  return member
}

export async function removeAlbumMember(memberId: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('album_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    throw new Error(`Failed to remove album member: ${error.message}`)
  }
}

export async function createAlbumInvite(
  albumId: string,
  email: string,
  role: AlbumRole
): Promise<AlbumInvite> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Generate invite token
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

  const { data: invite, error } = await supabase
    .from('album_invites')
    .insert({
      album_id: albumId,
      email: email.toLowerCase().trim(),
      invited_by: user.id,
      role: role,
      token: token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create album invite: ${error.message}`)
  }

  // Get album and inviter details for email
  const { data: album } = await supabase
    .from('albums')
    .select('name')
    .eq('id', albumId)
    .single()

  const { data: inviter } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Send invitation email
  try {
    const { sendAlbumInviteEmail, getInviteAcceptUrl } = await import(
      '@/lib/email'
    )

    await sendAlbumInviteEmail({
      to: invite.email,
      inviterName: inviter?.full_name || 'Someone',
      albumName: album?.name || 'Family Album',
      role: invite.role,
      inviteUrl: getInviteAcceptUrl(invite.token),
    })
  } catch (emailError) {
    console.error('Failed to send invite email:', emailError)
    // Don't fail the invite creation if email fails
  }

  return invite
}

export async function getInviteDetails(token: string) {
  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from('album_invites')
    .select(
      `
      *,
      album:albums(name, description),
      inviter:profiles!album_invites_invited_by_fkey(full_name)
    `
    )
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) {
    throw new Error('Invalid or expired invite')
  }

  return invite
}

export async function acceptAlbumInvite(token: string): Promise<string> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get the invite
  const { data: invite, error: inviteError } = await supabase
    .from('album_invites')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    throw new Error('Invalid or expired invite')
  }

  // Check if user email matches invite
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.email !== invite.email) {
    throw new Error('This invite is for a different email address')
  }

  // Add user as album member
  const { error: memberError } = await supabase.from('album_members').insert({
    album_id: invite.album_id,
    user_id: user.id,
    role: invite.role,
  })

  if (memberError) {
    throw new Error(`Failed to join album: ${memberError.message}`)
  }

  // Mark invite as used using RPC function to bypass RLS
  const { error: updateError } = await supabase.rpc('mark_invite_as_used', {
    invite_token: invite.token,
    user_email: invite.email,
  })

  if (updateError) {
    console.error('Error marking invite as used:', updateError)
    // Don't throw error for used_at update failure - the user is already added to album
  } else {
    console.log('Successfully marked invite as used')
  }

  return invite.album_id
}

export async function requestToJoinAlbum(
  albumId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message?: string
): Promise<AlbumInvite> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get user's profile for email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  // Check if album is public
  const { data: album } = await supabase
    .from('albums')
    .select('privacy_level, created_by')
    .eq('id', albumId)
    .single()

  if (!album || album.privacy_level !== AlbumPrivacyLevel.PUBLIC) {
    throw new Error('Album not found or not public')
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('album_members')
    .select('id')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    throw new Error('You are already a member of this album')
  }

  // Check if there's already a pending invite
  const { data: existingInvite } = await supabase
    .from('album_invites')
    .select('id')
    .eq('album_id', albumId)
    .eq('email', profile.email)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingInvite) {
    throw new Error('You already have a pending invitation to this album')
  }

  // Create join request (invite from the user to themselves)
  return await createAlbumInvite(albumId, profile.email, AlbumRole.VIEWER)
}

export async function getAlbumInvites(albumId: string): Promise<AlbumInvite[]> {
  await requireAuth()
  const supabase = await createClient()

  const { data: invites, error } = await supabase
    .from('album_invites')
    .select(
      `
      *,
      inviter:profiles!album_invites_invited_by_fkey(full_name)
    `
    )
    .eq('album_id', albumId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch invites: ${error.message}`)
  }

  return invites
}

export async function cancelAlbumInvite(inviteId: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('album_invites')
    .delete()
    .eq('id', inviteId)

  if (error) {
    throw new Error(`Failed to cancel invite: ${error.message}`)
  }
}

export async function getUserPendingInvites(): Promise<AlbumInvite[]> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get user's profile to get email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  const { data: invites, error } = await supabase
    .from('album_invites')
    .select(
      `
      *,
      album:albums(id, name, description),
      inviter:profiles!album_invites_invited_by_fkey(full_name, avatar_url)
    `
    )
    .eq('email', profile.email)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch pending invites: ${error.message}`)
  }

  return invites
}

export async function declineAlbumInvite(token: string): Promise<void> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get the invite
  const { data: invite, error: inviteError } = await supabase
    .from('album_invites')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    throw new Error('Invalid or expired invite')
  }

  // Check if user email matches invite
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.email !== invite.email) {
    throw new Error('This invite is for a different email address')
  }

  // Delete the invite (declining it)
  const { error: deleteError } = await supabase
    .from('album_invites')
    .delete()
    .eq('token', token)

  if (deleteError) {
    throw new Error(`Failed to decline invite: ${deleteError.message}`)
  }
}
