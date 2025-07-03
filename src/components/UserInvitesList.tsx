'use client'

import { useState } from 'react'
import { AlbumInvite } from '@/types'
import { InviteCard } from '@/components/InviteCard'

interface UserInvitesListProps {
  invites: AlbumInvite[]
}

export function UserInvitesList({ invites: initialInvites }: UserInvitesListProps) {
  const [invites, setInvites] = useState(initialInvites)

  const handleInviteAction = (inviteId: string) => {
    // Remove the invite from the list after action
    setInvites(prev => prev.filter(invite => invite.id !== inviteId))
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
        <p className="text-gray-500">
          You don&apos;t have any pending album invitations at the moment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {invites.length} pending invitation{invites.length !== 1 ? 's' : ''}
      </p>
      
      <div className="space-y-4">
        {invites.map((invite) => (
          <InviteCard
            key={invite.id}
            invite={invite}
            onAction={() => handleInviteAction(invite.id)}
          />
        ))}
      </div>
    </div>
  )
}