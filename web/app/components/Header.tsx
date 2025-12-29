'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './Header.module.css'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogin = () => {
    window.location.href = 'https://app.dseller.com/login'
  }

  const handleSignUp = () => {
    window.location.href = 'https://app.dseller.com/signup'
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>DSeller</span>
        </Link>
        
        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/about" className={styles.navLink}>About</Link>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/calculator" className={styles.navLink}>Calculator</Link>
        </nav>

        <div className={styles.actions}>
          <button onClick={handleLogin} className={styles.btnLogin}>
            Login
          </button>
          <button onClick={handleSignUp} className={styles.btnSignUp}>
            Sign Up
          </button>
          <button 
            className={styles.menuToggle}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  )
}

