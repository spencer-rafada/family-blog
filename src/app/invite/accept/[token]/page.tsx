import { notFound } from 'next/navigation'
import { getInviteDetails } from '@/lib/actions/albums'
import { getCurrentUser } from '@/lib/auth-utils'
import { InviteAcceptForm } from '@/components/InviteAcceptForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface InviteAcceptPageProps {
  params: Promise<{ token: string }>
}

export default async function InviteAcceptPage({
  params,
}: InviteAcceptPageProps) {
  const { token } = await params
  try {
    const invite = await getInviteDetails(token)
    const user = await getCurrentUser()

    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <div>
            <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
              You&apos;re Invited!
            </h2>
            <p className='mt-2 text-center text-sm text-gray-600'>
              Join &quot;{invite.album?.name}&quot; on Family Blog
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{invite.album?.name}</CardTitle>
              {invite.album?.description && (
                <CardDescription>{invite.album.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className='text-sm text-gray-600'>
                <p>
                  {invite.is_shareable ? (
                    <>
                      This is a shareable invitation link created by{' '}
                      <strong>{invite.inviter?.full_name || 'Someone'}</strong> for the role of{' '}
                      <strong className='capitalize'>{invite.role}</strong>
                    </>
                  ) : (
                    <>
                      <strong>{invite.inviter?.full_name || 'Someone'}</strong>{' '}
                      invited you as a{' '}
                      <strong className='capitalize'>{invite.role}</strong>
                    </>
                  )}
                </p>

                <div className='mt-2 text-xs'>
                  {invite.role === 'admin' && (
                    <p>You&apos;ll be able to manage the album and invite others.</p>
                  )}
                  {invite.role === 'contributor' && (
                    <p>
                      You&apos;ll be able to add posts and memories to this album.
                    </p>
                  )}
                  {invite.role === 'viewer' && (
                    <p>You&apos;ll be able to view content in this album.</p>
                  )}
                  
                  {invite.is_shareable && invite.max_uses && (
                    <p className='mt-2 text-gray-500'>
                      This link has been used {invite.uses_count} out of {invite.max_uses} times.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <InviteAcceptForm token={token} invite={invite} initialUser={user} />
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
