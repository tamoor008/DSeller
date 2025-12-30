'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAppRoute = pathname?.startsWith('/app')

  if (isAppRoute) {
    // App routes have their own layout
    return <>{children}</>
  }

  // Landing page routes get header and footer
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}




