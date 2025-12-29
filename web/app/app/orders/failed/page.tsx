'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../src-app/hooks/useAuth'
import FailedDeliveryOrdersPage from '../../../../src-app/pages/FailedDeliveryOrdersPage'

export default function FailedOrders() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/app/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return <FailedDeliveryOrdersPage />
}



