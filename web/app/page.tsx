import styles from './page.module.css'
import Link from 'next/link'
import { APP_ROUTES } from './config/constants'

export default function Home() {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Manage Your Daraz Business
              <span className={styles.gradient}> with Ease</span>
            </h1>
            <p className={styles.heroDescription}>
              Track orders, calculate profits, and grow your e-commerce business with DSeller. 
              The all-in-one toolkit designed specifically for Daraz sellers.
            </p>
            <div className={styles.heroActions}>
              <a href={APP_ROUTES.SIGNUP} className={`${styles.btn} ${styles.btnPrimary}`}>
                Get Started Free
              </a>
              <Link href="/calculator" className={`${styles.btn} ${styles.btnSecondary}`}>
                Try Calculator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Everything You Need to Succeed</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3 className={styles.featureTitle}>Order Management</h3>
              <p className={styles.featureDescription}>
                Track all your orders in one place. Monitor pending, ready to ship, 
                and delivered orders with real-time updates.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <h3 className={styles.featureTitle}>Profit Calculator</h3>
              <p className={styles.featureDescription}>
                Calculate your profits accurately with category-specific commissions 
                and handling fees. Test FBM and FBD scenarios instantly.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📈</div>
              <h3 className={styles.featureTitle}>Analytics & Reports</h3>
              <p className={styles.featureDescription}>
                Get weekly reports and insights into your business performance. 
                Make data-driven decisions to grow your sales.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📦</div>
              <h3 className={styles.featureTitle}>Inventory Tracking</h3>
              <p className={styles.featureDescription}>
                Manage your stock levels, packaging, and cash flow all from 
                a single dashboard.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔐</div>
              <h3 className={styles.featureTitle}>Secure & Reliable</h3>
              <p className={styles.featureDescription}>
                Your data is safe with us. We use industry-standard security 
                practices to protect your business information.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3 className={styles.featureTitle}>Fast & Efficient</h3>
              <p className={styles.featureDescription}>
                Built for speed. Access your data instantly and work seamlessly 
                across all your devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Grow Your Business?</h2>
            <p className={styles.ctaDescription}>
              Join thousands of Daraz sellers who trust DSeller to manage their business.
            </p>
            <a href={APP_ROUTES.SIGNUP} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
              Start Free Trial
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

