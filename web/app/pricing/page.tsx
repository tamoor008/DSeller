import styles from './page.module.css'
import { APP_ROUTES } from '../config/constants'

export default function Pricing() {
  return (
    <div className={styles.pricing}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>Simple, Transparent Pricing</h1>
          <p className={styles.subtitle}>
            Choose the plan that works best for your business
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.plans}>
            <div className={styles.plan}>
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>Free</h3>
                <div className={styles.planPrice}>
                  <span className={styles.price}>$0</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>
              <ul className={styles.features}>
                <li>✓ Basic order tracking</li>
                <li>✓ Profit calculator</li>
                <li>✓ Limited analytics</li>
                <li>✓ Up to 100 orders/month</li>
              </ul>
              <a href={APP_ROUTES.SIGNUP} className={styles.btn}>
                Get Started
              </a>
            </div>

            <div className={`${styles.plan} ${styles.planFeatured}`}>
              <div className={styles.badge}>Most Popular</div>
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>Pro</h3>
                <div className={styles.planPrice}>
                  <span className={styles.price}>$29</span>
                  <span className={styles.period}>/month</span>
                </div>
              </div>
              <ul className={styles.features}>
                <li>✓ Unlimited order tracking</li>
                <li>✓ Advanced profit calculator</li>
                <li>✓ Full analytics & reports</li>
                <li>✓ Inventory management</li>
                <li>✓ Cash flow tracking</li>
                <li>✓ Priority support</li>
              </ul>
              <a href={APP_ROUTES.SIGNUP} className={styles.btn}>
                Start Free Trial
              </a>
            </div>

            <div className={styles.plan}>
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>Enterprise</h3>
                <div className={styles.planPrice}>
                  <span className={styles.price}>Custom</span>
                </div>
              </div>
              <ul className={styles.features}>
                <li>✓ Everything in Pro</li>
                <li>✓ Multi-store management</li>
                <li>✓ Custom integrations</li>
                <li>✓ Dedicated account manager</li>
                <li>✓ Custom reporting</li>
                <li>✓ 24/7 support</li>
              </ul>
              <a href="mailto:sales@dseller.com" className={styles.btn}>
                Contact Sales
              </a>
            </div>
          </div>

          <div className={styles.faq}>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Can I change plans later?</h3>
                <p className={styles.faqAnswer}>
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be 
                  reflected in your next billing cycle.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Is there a free trial?</h3>
                <p className={styles.faqAnswer}>
                  Yes! All paid plans come with a 14-day free trial. No credit card required 
                  to start.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>What payment methods do you accept?</h3>
                <p className={styles.faqAnswer}>
                  We accept all major credit cards, debit cards, and PayPal. Enterprise plans 
                  can be invoiced.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Do you offer refunds?</h3>
                <p className={styles.faqAnswer}>
                  Yes, we offer a 30-day money-back guarantee. If you're not satisfied, 
                  contact us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

