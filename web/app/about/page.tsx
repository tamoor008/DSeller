import styles from './page.module.css'
import { APP_ROUTES } from '../config/constants'

export default function About() {
  return (
    <div className={styles.about}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>About DSeller</h1>
          <p className={styles.subtitle}>
            Empowering Daraz sellers to build successful e-commerce businesses
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Our Mission</h2>
            <p className={styles.text}>
              DSeller was born from the frustration of managing a Daraz business with multiple 
              spreadsheets, calculators, and tools. We believe that running an e-commerce business 
              should be simple, efficient, and profitable. Our mission is to provide Daraz sellers 
              with a comprehensive toolkit that streamlines their operations and helps them make 
              data-driven decisions.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>What We Offer</h2>
            <div className={styles.features}>
              <div className={styles.feature}>
                <h3 className={styles.featureTitle}>Order Management</h3>
                <p className={styles.featureText}>
                  Keep track of all your orders in one centralized dashboard. Monitor order status, 
                  track deliveries, and manage your fulfillment process efficiently.
                </p>
              </div>
              <div className={styles.feature}>
                <h3 className={styles.featureTitle}>Profit Calculator</h3>
                <p className={styles.featureText}>
                  Our advanced calculator helps you determine the true profitability of your products. 
                  Factor in commissions, handling fees, and shipping costs to make informed pricing decisions.
                </p>
              </div>
              <div className={styles.feature}>
                <h3 className={styles.featureTitle}>Business Analytics</h3>
                <p className={styles.featureText}>
                  Get insights into your business performance with detailed reports and analytics. 
                  Understand your sales trends, profit margins, and growth opportunities.
                </p>
              </div>
              <div className={styles.feature}>
                <h3 className={styles.featureTitle}>Inventory Management</h3>
                <p className={styles.featureText}>
                  Manage your stock levels, track packaging materials, and monitor your cash flow 
                  all from a single platform.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Why Choose DSeller?</h2>
            <ul className={styles.list}>
              <li>
                <strong>Built for Daraz:</strong> Our tools are specifically designed for the Daraz 
                marketplace, with accurate commission rates and fee structures.
              </li>
              <li>
                <strong>Easy to Use:</strong> We've designed DSeller to be intuitive and user-friendly. 
                No complex setup or training required.
              </li>
              <li>
                <strong>Always Updated:</strong> We continuously update our platform with the latest 
                Daraz policies and commission structures.
              </li>
              <li>
                <strong>Secure & Private:</strong> Your business data is encrypted and stored securely. 
                We never share your information with third parties.
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Get Started Today</h2>
            <p className={styles.text}>
              Join thousands of Daraz sellers who are already using DSeller to grow their businesses. 
              Start your free trial today and experience the difference.
            </p>
            <div className={styles.actions}>
              <a href={APP_ROUTES.SIGNUP} className={styles.btn}>
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

