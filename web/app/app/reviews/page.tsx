'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../src-app/hooks/useAuth'
import ReviewsPage from '../../../src-app/pages/ReviewsPage'

export default function Reviews() {
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

    return <ReviewsPage />
}
