import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { requestPasswordReset } from '@/lib/actions/auth'

// Mock the server action
jest.mock('@/lib/actions/auth', () => ({
  requestPasswordReset: jest.fn(),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockedLink.displayName = 'Link'
  return MockedLink
})

describe('ForgotPasswordForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the form with email input', () => {
    render(<ForgotPasswordForm />)

    expect(screen.getByText('Forgot Password?')).toBeInTheDocument()
    expect(screen.getByText(/Enter your email address/)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument()
    expect(screen.getByText('Remember your password?')).toBeInTheDocument()
    expect(screen.getByText('Back to login')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

    // Clear the input first, then type invalid email without @ symbol
    await user.clear(emailInput)
    await user.type(emailInput, 'invalidemail.com')
    
    // Try to submit - HTML5 validation will prevent submission
    await user.click(submitButton)

    // Since HTML5 validation prevents form submission, the server action should not be called
    expect(requestPasswordReset).not.toHaveBeenCalled()
    
    // Now test with a proper email format that passes HTML5 validation
    // but our Zod validation could catch other issues
    await user.clear(emailInput)
    await user.type(emailInput, 'test@')
    await user.click(submitButton)
    
    // HTML5 validation might let this through, but Zod should catch it
    await waitFor(() => {
      expect(requestPasswordReset).not.toHaveBeenCalled()
    })
  })

  it('submits form with valid email', async () => {
    ;(requestPasswordReset as jest.Mock).mockResolvedValue({ success: true })

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('test@example.com')
    })

    // Should show success message
    expect(screen.getByText('Check Your Email')).toBeInTheDocument()
    expect(screen.getByText(/We've sent you a password reset link/)).toBeInTheDocument()
    expect(screen.getByText(/The reset link will expire in 1 hour/)).toBeInTheDocument()
  })

  it('displays error message when request fails', async () => {
    ;(requestPasswordReset as jest.Mock).mockResolvedValue({ 
      error: 'User not found' 
    })

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

    await user.type(emailInput, 'notfound@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('notfound@example.com')
    })

    expect(screen.getByText('User not found')).toBeInTheDocument()
    // Form should still be visible
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('handles unexpected errors gracefully', async () => {
    ;(requestPasswordReset as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    ;(requestPasswordReset as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    // Check button shows loading state
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled()
    expect(emailInput).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
    })
  })

  it('has working back to login link', () => {
    render(<ForgotPasswordForm />)

    const backLink = screen.getByText('Back to login')
    expect(backLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('shows back to login link in success state', async () => {
    ;(requestPasswordReset as jest.Mock).mockResolvedValue({ success: true })

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
    })

    const backLink = screen.getByText('Back to login')
    expect(backLink.closest('a')).toHaveAttribute('href', '/login')
  })
})