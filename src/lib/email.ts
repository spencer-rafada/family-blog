import { Resend } from 'resend'
import { AlbumRole } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendInviteEmailProps {
  to: string
  inviterName: string
  albumName: string
  role: AlbumRole
  inviteUrl: string
}

export async function sendAlbumInviteEmail({
  to,
  inviterName,
  albumName,
  role,
  inviteUrl,
}: SendInviteEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.log('Resend API key not configured, skipping email send')
    console.log(
      `Would send invite to ${to} for album "${albumName}" with role ${role}`
    )
    console.log(`Invite URL: ${inviteUrl}`)
    return { success: true, messageId: 'dev-mode' }
  }

  const roleDescriptions = {
    admin: 'manage the album and invite others',
    contributor: 'add posts and memories',
    viewer: 'view content',
  }

  const subject = `You're invited to join "${albumName}" on Family Blog`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center;">You're Invited!</h1>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; margin: 0 0 10px 0;">
          <strong>${inviterName}</strong> has invited you to join the album <strong>"${albumName}"</strong> on Family Blog.
        </p>
        
        <p style="font-size: 14px; color: #666; margin: 0;">
          You'll be able to <strong>${roleDescriptions[role]}</strong> in this album.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Family Blog <noreply@familyblog.com>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send invite email:', error)
      throw new Error(`Failed to send invite email: ${error.message}`)
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    throw error
  }
}

export function getInviteAcceptUrl(token: string): string {
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://family-blog-eta.vercel.app/' // Your production domain as fallback
  return `${baseUrl}/invite/accept/${token}`
}
