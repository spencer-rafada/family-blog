import { redirect } from 'next/navigation'
import { getUserPendingInvites } from '@/lib/actions/invites'
import { getCurrentUser } from '@/lib/auth-utils'
import { UserInvitesList } from '@/components/UserInvitesList'

export default async function InvitesPage() {
  try {
    // Server-side auth protection
    const user = await getCurrentUser()

    if (!user) {
      redirect('/login?redirectTo=/invites')
    }

    // Fetch pending invites server-side
    const invites = await getUserPendingInvites()

    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Your Invitations
            </h1>
            <p className='mt-2 text-gray-600'>
              Manage your pending album invitations
            </p>
          </div>

          <UserInvitesList invites={invites} />
        </div>
      </div>
    )
  } catch (error) {
    // Handle errors gracefully
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Your Invitations
            </h1>
            <p className='mt-2 text-gray-600'>
              Manage your pending album invitations
            </p>
          </div>

          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <p className='text-sm text-red-600'>
              {error instanceof Error
                ? error.message
                : 'Failed to load invitations'}
            </p>
          </div>
        </div>
      </div>
    )
  }
}
