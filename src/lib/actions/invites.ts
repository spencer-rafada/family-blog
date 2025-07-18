'use server'

import { AlbumInvite, AlbumRole } from '@/types'
import { requireAuth } from '../auth-utils'
import { createClient } from '../supabase/server'
import { SupabaseErrorCode } from '../constants'
import crypto from 'crypto'

/**
 * Creates an email-based invitation for a specific user to join an album
 * @param albumId - The ID of the album to invite the user to
 * @param email - The email address of the user to invite
 * @param role - The role to assign to the user when they accept the invite
 * @returns The created album invite
 * @throws Error if the user doesn't have permission, if the user is already a member,
 *         if an invite already exists, or if the operation fails
 */
export async function createAlbumInvite(
  albumId: string,
  email: string,
  role: AlbumRole
): Promise<AlbumInvite> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim()

  // Check if user with this email already exists
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  // Handle profile lookup error (ignore not found errors)
  if (profileError && profileError.code !== SupabaseErrorCode.NOT_FOUND) {
    throw new Error(`Failed to check user profile: ${profileError.message}`)
  }

  // If user exists, check if they're already a member
  if (existingProfile) {
    const { data: existingMember, error: memberError } = await supabase
      .from('album_members')
      .select('id')
      .eq('album_id', albumId)
      .eq('user_id', existingProfile.id)
      .single()

    // Handle member lookup error (ignore not found errors)
    if (memberError && memberError.code !== SupabaseErrorCode.NOT_FOUND) {
      throw new Error(
        `Failed to check album membership: ${memberError.message}`
      )
    }

    if (existingMember) {
      throw new Error('This user is already a member of the album')
    }
  }

  // Check if there's already a pending invite for this email
  const { data: existingInvite, error: inviteError } = await supabase
    .from('album_invites')
    .select('id')
    .eq('album_id', albumId)
    .eq('email', normalizedEmail)
    .is('used_at', null) // NULL means pending
    .single()

  // Handle invite lookup error (ignore not found errors)
  if (inviteError && inviteError.code !== SupabaseErrorCode.NOT_FOUND) {
    throw new Error(
      `Failed to check existing invitations: ${inviteError.message}`
    )
  }

  if (existingInvite) {
    throw new Error('An invitation has already been sent to this email')
  }

  // Generate invite token
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

  const { data: invite, error } = await supabase
    .from('album_invites')
    .insert({
      album_id: albumId,
      email: normalizedEmail,
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
    const { sendAlbumInviteEmail } = await import('@/lib/email')
    const { getInviteAcceptUrl } = await import('@/lib/invite-utils')

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

/**
 * Creates a shareable invitation link that can be used by anyone to join an album
 * @param albumId - The ID of the album to create the invite for
 * @param role - The role to assign to users who accept the invite
 * @param maxUses - Optional maximum number of times the link can be used (null for unlimited)
 * @returns The created shareable invite
 * @throws Error if the user doesn't have permission or if the operation fails
 */
export async function createShareableInvite(
  albumId: string,
  role: AlbumRole,
  maxUses?: number
): Promise<AlbumInvite> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Check if user has permission to invite
  const { data: membership, error: membershipError } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    throw new Error('You do not have access to this album')
  }

  // Only admins can invite
  if (membership.role !== AlbumRole.ADMIN) {
    throw new Error('Only album admins can create invites')
  }

  // Check rate limiting - max 10 active shareable invites per album
  const { data: activeInvites, error: countError } = await supabase
    .from('album_invites')
    .select('id')
    .eq('album_id', albumId)
    .eq('is_shareable', true)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())

  if (!countError && activeInvites && activeInvites.length >= 10) {
    throw new Error('Maximum number of active shareable invites reached (10). Please revoke some existing invites.')
  }

  // Generate invite token
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // Shareable links expire in 30 days

  const { data: invite, error } = await supabase
    .from('album_invites')
    .insert({
      album_id: albumId,
      email: '', // Empty email for shareable invites
      invited_by: user.id,
      role: role,
      token: token,
      expires_at: expiresAt.toISOString(),
      is_shareable: true,
      max_uses: maxUses || null, // null means unlimited
      uses_count: 0,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create shareable invite: ${error.message}`)
  }

  return invite
}

/**
 * Gets all active shareable invites for an album
 * @param albumId - The ID of the album
 * @returns List of active shareable invites
 * @throws Error if the user doesn't have permission (must be admin) or if the operation fails
 */
export async function getShareableInvites(
  albumId: string
): Promise<AlbumInvite[]> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Check if user has permission to view invites
  const { data: membership, error: membershipError } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    throw new Error('You do not have access to this album')
  }

  // Only admins can view invites
  if (membership.role !== AlbumRole.ADMIN) {
    throw new Error('Only album admins can view invites')
  }

  const { data: invites, error } = await supabase
    .from('album_invites')
    .select(
      `
      *,
      inviter:profiles!album_invites_invited_by_fkey(full_name)
    `
    )
    .eq('album_id', albumId)
    .eq('is_shareable', true)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch shareable invites: ${error.message}`)
  }

  return invites || []
}

/**
 * Gets the details of an invite by token
 * @param token - The invitation token
 * @returns The invite details with related album and inviter information
 * @throws Error if the invite is not found, expired, or if the operation fails
 */
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

/**
 * Accepts an album invitation using a token
 * @param token - The invitation token
 * @returns The album ID that the user joined
 * @throws Error if the invite is invalid, expired, the user doesn't meet requirements,
 *         or if the operation fails
 */
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

  // For shareable invites, check if max uses has been reached
  if (invite.is_shareable) {
    if (invite.max_uses && invite.uses_count >= invite.max_uses) {
      throw new Error('This invite link has reached its maximum number of uses')
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('album_members')
      .select('id')
      .eq('album_id', invite.album_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      throw new Error('You are already a member of this album')
    }
  } else {
    // For email invites, check if user email matches invite
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile || profile.email !== invite.email) {
      throw new Error('This invite is for a different email address')
    }
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

  // For shareable invites, increment uses count
  if (invite.is_shareable) {
    const { error: incrementError } = await supabase.rpc(
      'increment_invite_uses_count',
      {
        invite_token: invite.token,
      }
    )

    if (incrementError) {
      console.error('Error incrementing invite uses count:', incrementError)
    }
  } else {
    // For email invites, mark as used
    const { error: updateError } = await supabase.rpc('mark_invite_as_used', {
      invite_token: invite.token,
      user_email: invite.email,
    })

    if (updateError) {
      console.error('Error marking invite as used:', updateError)
    }
  }

  return invite.album_id
}

/**
 * Gets all email-based invites for an album
 * @param albumId - The ID of the album
 * @returns List of active email invites
 * @throws Error if the operation fails
 */
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
    .eq('is_shareable', false) // Only get email-based invites
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch invites: ${error.message}`)
  }

  return invites
}

/**
 * Cancels an album invite by deleting it
 * @param inviteId - The ID of the invite to cancel
 * @throws Error if the operation fails
 */
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

/**
 * Gets all pending invites for the current user based on their email
 * @returns List of pending invites for the current user
 * @throws Error if the user profile is not found or if the operation fails
 */
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

/**
 * Declines an album invite by deleting it
 * @param token - The invitation token
 * @throws Error if the invite is invalid, doesn't match the user's email, or if the operation fails
 */
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

/**
 * Revokes a shareable invite by setting its expiration date to now
 * @param inviteId - The ID of the invite to revoke
 * @throws Error if the user doesn't have permission (must be admin) or if the operation fails
 */
export async function revokeShareableInvite(inviteId: string): Promise<void> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get the invite to check album membership
  const { data: invite, error: inviteError } = await supabase
    .from('album_invites')
    .select('album_id')
    .eq('id', inviteId)
    .eq('is_shareable', true)
    .single()

  if (inviteError || !invite) {
    throw new Error('Invite not found')
  }

  // Check if user has permission (must be admin)
  const { data: membership, error: membershipError } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', invite.album_id)
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership || membership.role !== AlbumRole.ADMIN) {
    throw new Error('Only album admins can revoke invites')
  }

  // Set the invite as expired
  const { error } = await supabase
    .from('album_invites')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', inviteId)

  if (error) {
    throw new Error(`Failed to revoke invite: ${error.message}`)
  }
}
