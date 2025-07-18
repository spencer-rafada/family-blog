import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { updatePassword } from '@/lib/actions/auth'

// Mock the server action
jest.mock('@/lib/actions/auth', () => ({
  updatePassword: jest.fn(),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('ResetPasswordForm', () => {
  const user = userEvent.setup()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders the form with password inputs', () => {
    render(<ResetPasswordForm />)

    expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
    expect(
      screen.getByText('Enter your new password below')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Enter new password')
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Confirm new password')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reset Password' })
    ).toBeInTheDocument()
  })

  it('validates password length', async () => {
    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Reset Password' })

    // Try to submit with short password
    await user.type(passwordInput, '12345')
    await user.type(confirmInput, '12345')
    await user.click(submitButton)

    expect(
      await screen.findByText('Password must be at least 6 characters')
    ).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('validates password confirmation match', async () => {
    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Reset Password' })

    // Try to submit with mismatched passwords
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password456')
    await user.click(submitButton)

    expect(
      await screen.findByText('Passwords do not match')
    ).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('submits form with valid matching passwords', async () => {
    ;(updatePassword as jest.Mock).mockResolvedValue({ success: true })

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Reset Password' })

    await user.type(passwordInput, 'newpassword123')
    await user.type(confirmInput, 'newpassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('newpassword123')
    })

    // Should redirect to login with success message
    expect(mockPush).toHaveBeenCalledWith(
      '/login?message=password-reset-success'
    )
  })

  it('displays error message when update fails', async () => {
    ;(updatePassword as jest.Mock).mockResolvedValue({
      error: 'Invalid or expired token',
    })

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Reset Password' })

    await user.type(passwordInput, 'newpassword123')
    await user.type(confirmInput, 'newpassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('newpassword123')
    })

    expect(screen.getByText('Invalid or expired token')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('handles unexpected errors gracefully', async () => {
    ;(updatePassword as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Reset Password' })

    await user.type(passwordInput, 'newpassword123')
    await user.type(confirmInput, 'newpassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables form during submission', async () => {
    ;(updatePassword as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    )

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Reset Password' })

    await user.type(passwordInput, 'newpassword123')
    await user.type(confirmInput, 'newpassword123')
    await user.click(submitButton)

    // Check button shows loading state
    expect(screen.getByRole('button', { name: 'Resetting...' })).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(confirmInput).toBeDisabled()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/login?message=password-reset-success'
      )
    })
  })

  it('clears error message when user types', async () => {
    ;(updatePassword as jest.Mock).mockResolvedValue({
      error: 'Invalid token',
    })

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText('New Password')
    const confirmInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Reset Password' })

    // First submission with error
    await user.type(passwordInput, 'password123')
    await user.type(confirmInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeInTheDocument()
    })

    // Clear inputs and type new password
    await user.clear(passwordInput)
    await user.clear(confirmInput)

    // Mock successful response for next attempt
    ;(updatePassword as jest.Mock).mockResolvedValue({ success: true })

    await user.type(passwordInput, 'newpassword456')
    await user.type(confirmInput, 'newpassword456')

    // Submit again
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/login?message=password-reset-success'
      )
    })
  })

  it('shows validation error for empty password', async () => {
    render(<ResetPasswordForm />)

    const submitButton = screen.getByRole('button', { name: 'Reset Password' })
    await user.click(submitButton)

    // HTML5 validation should prevent submission, but let's check our validation too
    const confirmInput = screen.getByLabelText('Confirm Password')

    // Type only in confirm field
    await user.type(confirmInput, 'password123')
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(updatePassword).not.toHaveBeenCalled()
    })
  })
})
