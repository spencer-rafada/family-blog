import { notFound } from 'next/navigation'
import { getInviteDetails } from '@/lib/actions/albums'
import { InviteAcceptForm } from '@/components/InviteAcceptForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface InviteAcceptPageProps {
  params: { token: string }
}

export default async function InviteAcceptPage({ params }: InviteAcceptPageProps) {
  try {
    const invite = await getInviteDetails(params.token)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              You're Invited!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join "{invite.album?.name}" on Family Blog
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
              <div className="text-sm text-gray-600">
                <p>
                  <strong>{invite.inviter?.full_name || 'Someone'}</strong> invited you
                  as a <strong className="capitalize">{invite.role}</strong>
                </p>
                
                <div className="mt-2 text-xs">
                  {invite.role === 'admin' && (
                    <p>You'll be able to manage the album and invite others.</p>
                  )}
                  {invite.role === 'contributor' && (
                    <p>You'll be able to add posts and memories to this album.</p>
                  )}
                  {invite.role === 'viewer' && (
                    <p>You'll be able to view content in this album.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <InviteAcceptForm token={params.token} />
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}