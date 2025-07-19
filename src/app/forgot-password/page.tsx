import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { ForgotPasswordFormSkeleton } from '@/components/ForgotPasswordFormSkeleton'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFormSkeleton />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}