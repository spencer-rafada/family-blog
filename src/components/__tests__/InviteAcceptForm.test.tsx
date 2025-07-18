import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import { InviteAcceptForm } from '@/components/InviteAcceptForm'
import { acceptAlbumInvite } from '@/lib/actions/invites'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useAutoAcceptInvite } from '@/lib/hooks/useAutoAcceptInvite'
import { AlbumInvite, AlbumRole } from '@/types'
import { User } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@/lib/actions/invites')
jest.mock('@/lib/hooks/useCurrentUser')
jest.mock('@/lib/hooks/useAutoAcceptInvite')

const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

describe('InviteAcceptForm', () => {
  const user = userEvent.setup()

  const mockEmailInvite: AlbumInvite = {
    id: 'invite-123',
    album_id: 'album-123',
    email: 'test@example.com',
    invited_by: 'inviter-123',
    role: AlbumRole.VIEWER,
    token: 'test-token',
    expires_at: '2024-12-31',
    used_at: null,
    created_at: '2024-01-01',
    is_shareable: false,
  }

  const mockShareableInvite: AlbumInvite = {
    ...mockEmailInvite,
    email: '',
    is_shareable: true,
    max_uses: 10,
    uses_count: 3,
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  } as User

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(useAutoAcceptInvite as jest.Mock).mockReturnValue({
      isAccepting: false,
      error: null,
    })
  })

  describe('Email Invites', () => {
    describe('when user is not authenticated', () => {
      beforeEach(() => {
        ;(useCurrentUser as jest.Mock).mockReturnValue({ user: null })
      })

      it('shows sign in/up options with email requirement', () => {
        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockEmailInvite}
            initialUser={null}
          />
        )

        expect(
          screen.getByText(/sign in or create an account with/)
        ).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Sign Up' })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      it('redirects to signup with email parameter', async () => {
        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockEmailInvite}
            initialUser={null}
          />
        )

        const signUpButton = screen.getByRole('button', { name: 'Sign Up' })
        await user.click(signUpButton)

        expect(mockPush).toHaveBeenCalledWith(
          '/signup?invite_token=test-token&email=test%40example.com'
        )
      })

      it('redirects to login with token', async () => {
        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockEmailInvite}
            initialUser={null}
          />
        )

        const signInButton = screen.getByRole('button', { name: 'Sign In' })
        await user.click(signInButton)

        expect(mockPush).toHaveBeenCalledWith('/login?invite_token=test-token')
      })
    })

    describe('when user is authenticated', () => {
      beforeEach(() => {
        ;(useCurrentUser as jest.Mock).mockReturnValue({ user: mockUser })
      })

      it('shows accept/decline options', () => {
        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockEmailInvite}
            initialUser={mockUser}
          />
        )

        expect(
          screen.getByRole('button', { name: 'Accept Invitation' })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Decline' })
        ).toBeInTheDocument()
        expect(screen.getByText("You're signed in as")).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })

      it('accepts invitation successfully', async () => {
        ;(acceptAlbumInvite as jest.Mock).mockResolvedValueOnce('album-123')

        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockEmailInvite}
            initialUser={mockUser}
          />
        )

        const acceptButton = screen.getByRole('button', {
          name: 'Accept Invitation',
        })
        await user.click(acceptButton)

        expect(acceptAlbumInvite).toHaveBeenCalledWith('test-token')

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/albums/album-123')
        })
      })

      it('shows error when acceptance fails', async () => {
        ;(acceptAlbumInvite as jest.Mock).mockRejectedValueOnce(
          new Error('This invite is for a different email address')
        )

        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockEmailInvite}
            initialUser={mockUser}
          />
        )

        const acceptButton = screen.getByRole('button', {
          name: 'Accept Invitation',
        })
        await user.click(acceptButton)

        await waitFor(() => {
          expect(
            screen.getByText('This invite is for a different email address')
          ).toBeInTheDocument()
        })
      })
    })
  })

  describe('Shareable Invites', () => {
    describe('when user is not authenticated', () => {
      beforeEach(() => {
        ;(useCurrentUser as jest.Mock).mockReturnValue({ user: null })
      })

      it('shows generic sign in/up message without email requirement', () => {
        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockShareableInvite}
            initialUser={null}
          />
        )

        expect(
          screen.getByText(
            'To accept this invitation, you need to sign in or create an account.'
          )
        ).toBeInTheDocument()
        // Should not show specific email requirement
        expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
      })

      it('redirects to signup without email parameter', async () => {
        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockShareableInvite}
            initialUser={null}
          />
        )

        const signUpButton = screen.getByRole('button', { name: 'Sign Up' })
        await user.click(signUpButton)

        expect(mockPush).toHaveBeenCalledWith('/signup?invite_token=test-token')
      })
    })

    describe('when user is authenticated', () => {
      beforeEach(() => {
        ;(useCurrentUser as jest.Mock).mockReturnValue({ user: mockUser })
      })

      it('does not show email for shareable invites', () => {
        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockShareableInvite}
            initialUser={mockUser}
          />
        )

        // Should not show "You're signed in as" message for shareable invites
        expect(
          screen.queryByText("You're signed in as")
        ).not.toBeInTheDocument()
      })

      it('accepts shareable invitation successfully', async () => {
        ;(acceptAlbumInvite as jest.Mock).mockResolvedValueOnce('album-123')

        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockShareableInvite}
            initialUser={mockUser}
          />
        )

        const acceptButton = screen.getByRole('button', {
          name: 'Accept Invitation',
        })
        await user.click(acceptButton)

        expect(acceptAlbumInvite).toHaveBeenCalledWith('test-token')

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/albums/album-123')
        })
      })

      it('shows error when max uses reached', async () => {
        ;(acceptAlbumInvite as jest.Mock).mockRejectedValueOnce(
          new Error('This invite link has reached its maximum number of uses')
        )

        render(
          <InviteAcceptForm
            token='test-token'
            invite={mockShareableInvite}
            initialUser={mockUser}
          />
        )

        const acceptButton = screen.getByRole('button', {
          name: 'Accept Invitation',
        })
        await user.click(acceptButton)

        await waitFor(() => {
          expect(
            screen.getByText(
              'This invite link has reached its maximum number of uses'
            )
          ).toBeInTheDocument()
        })
      })
    })
  })

  describe('Auto-accept behavior', () => {
    it('shows auto-accepting state when redirected from auth', () => {
      ;(useCurrentUser as jest.Mock).mockReturnValue({ user: mockUser })
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'redirected' ? 'true' : null),
      })
      ;(useAutoAcceptInvite as jest.Mock).mockReturnValue({
        isAccepting: true,
        error: null,
      })

      render(
        <InviteAcceptForm
          token='test-token'
          invite={mockEmailInvite}
          initialUser={mockUser}
        />
      )

      expect(
        screen.getByText('Welcome back! Accepting your invitation...')
      ).toBeInTheDocument()
      expect(screen.getByText('Accepting Invitation...')).toBeInTheDocument()
    })

    it('shows error from auto-accept', () => {
      ;(useCurrentUser as jest.Mock).mockReturnValue({ user: mockUser })
      ;(useSearchParams as jest.Mock).mockReturnValue({
        get: (key: string) => (key === 'redirected' ? 'true' : null),
      })
      ;(useAutoAcceptInvite as jest.Mock).mockReturnValue({
        isAccepting: false,
        error: 'Already a member',
      })

      render(
        <InviteAcceptForm
          token='test-token'
          invite={mockEmailInvite}
          initialUser={mockUser}
        />
      )

      expect(screen.getByText('Already a member')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('allows user to decline invitation', async () => {
      ;(useCurrentUser as jest.Mock).mockReturnValue({ user: mockUser })

      render(
        <InviteAcceptForm
          token='test-token'
          invite={mockEmailInvite}
          initialUser={mockUser}
        />
      )

      const declineButton = screen.getByRole('button', { name: 'Decline' })
      await user.click(declineButton)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('allows user to go back (Maybe Later)', async () => {
      ;(useCurrentUser as jest.Mock).mockReturnValue({ user: null })

      render(
        <InviteAcceptForm
          token='test-token'
          invite={mockEmailInvite}
          initialUser={null}
        />
      )

      const maybeLaterButton = screen.getByRole('button', {
        name: 'Maybe Later',
      })
      await user.click(maybeLaterButton)

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
