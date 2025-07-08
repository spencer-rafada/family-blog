import { useState, useEffect } from 'react'

// Client-side hook to access feature flags
export function useFlags() {
  const [flags, setFlags] = useState({
    discover: false,
    profile: false,
    admin: false,
    settings: false,
    'public-posts': false,
    about: false,
  })

  useEffect(() => {
    const loadFlags = async () => {
      try {
        // Try to get flag overrides from cookie (set by Vercel Toolbar)
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('vercel-flag-overrides='))
          ?.split('=')[1]

        if (cookieValue) {
          // Make API call to decrypt flags on the server
          const response = await fetch('/api/flags/decrypt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ encryptedFlags: decodeURIComponent(cookieValue) }),
          })

          if (response.ok) {
            const overrides = await response.json()
            setFlags(current => ({
              ...current,
              ...overrides,
            }))
          }
        }
      } catch (error) {
        // Silently fail and use default values
        console.debug('Failed to load flag overrides:', error)
      }
    }

    loadFlags()
  }, [])

  return flags
}