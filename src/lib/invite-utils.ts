export function getInviteAcceptUrl(token: string): string {
  // On client side, use window.location.origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/accept/${token}`
  }
  
  // On server side, use environment variables
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://family-blog-eta.vercel.app/' // Your production domain as fallback
  return `${baseUrl}/invite/accept/${token}`
}