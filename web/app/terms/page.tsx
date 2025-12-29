import styles from './page.module.css'

export default function Terms() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.subtitle}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Agreement to Terms</h2>
            <p className={styles.text}>
              By accessing or using DSeller, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access the service.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Use License</h2>
            <p className={styles.text}>
              Permission is granted to temporarily use DSeller for personal and commercial purposes. 
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className={styles.list}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose without explicit permission</li>
              <li>Attempt to reverse engineer any software contained in DSeller</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>User Accounts</h2>
            <p className={styles.text}>
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Service Availability</h2>
            <p className={styles.text}>
              We strive to provide reliable service but do not guarantee uninterrupted access. 
              We reserve the right to modify or discontinue the service at any time.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Limitation of Liability</h2>
            <p className={styles.text}>
              In no event shall DSeller be liable for any damages arising out of the use or 
              inability to use the service.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Contact Us</h2>
            <p className={styles.text}>
              If you have questions about these Terms of Service, please contact us at legal@dseller.com
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

