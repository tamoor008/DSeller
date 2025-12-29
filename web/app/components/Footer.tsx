import Link from 'next/link'
import styles from './Footer.module.css'
import { APP_ROUTES } from '../config/constants'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.logo}>DSeller</h3>
            <p className={styles.description}>
              The all-in-one toolkit for Daraz sellers. Manage orders, calculate profits, and grow your business.
            </p>
          </div>

          <div className={styles.section}>
            <h4 className={styles.heading}>Product</h4>
            <ul className={styles.links}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/calculator">Calculator</Link></li>
            </ul>
          </div>

          <div className={styles.section}>
            <h4 className={styles.heading}>Account</h4>
            <ul className={styles.links}>
              <li><Link href={APP_ROUTES.LOGIN}>Login</Link></li>
              <li><Link href={APP_ROUTES.SIGNUP}>Sign Up</Link></li>
            </ul>
          </div>

          <div className={styles.section}>
            <h4 className={styles.heading}>Legal</h4>
            <ul className={styles.links}>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} DSeller. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

