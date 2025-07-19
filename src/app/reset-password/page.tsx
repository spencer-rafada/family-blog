import { Suspense } from 'react'
import { ResetPasswordFormSkeleton } from '@/components/ResetPasswordFormSkeleton'
import { ResetPasswordContent } from './ResetPasswordContent'

interface ResetPasswordPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  return (
    <Suspense fallback={<ResetPasswordFormSkeleton />}>
      <ResetPasswordContent error={error} />
    </Suspense>
  )
}
