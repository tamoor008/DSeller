// Navigation utility to help migrate from React Router to Next.js
// This provides a compatible API for existing components

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const useNavigate = () => {
  const router = useRouter()
  return (path: string | number) => {
    if (typeof path === 'number') {
      // Handle React Router's navigate(-1) pattern
      if (path === -1) {
        router.back()
      } else {
        // For other numbers, treat as relative navigation (not common in Next.js)
        router.back()
      }
    } else {
      router.push(path)
    }
  }
}

export const useLocation = () => {
  const pathname = usePathname()
  return { pathname }
}

// Export useSearchParams for query parameter access
export { useSearchParams }

// For Link component, use Next.js Link directly
export { Link }

