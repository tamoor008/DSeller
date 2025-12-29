import styles from './page.module.css'

export default function Privacy() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.subtitle}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Introduction</h2>
            <p className={styles.text}>
              DSeller ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Information We Collect</h2>
            <p className={styles.text}>
              We collect information that you provide directly to us, including:
            </p>
            <ul className={styles.list}>
              <li>Account information (name, email address, password)</li>
              <li>Business information (store details, order data)</li>
              <li>Usage data (how you interact with our service)</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>How We Use Your Information</h2>
            <p className={styles.text}>
              We use the information we collect to:
            </p>
            <ul className={styles.list}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Data Security</h2>
            <p className={styles.text}>
              We implement appropriate technical and organizational security measures to protect your 
              personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.heading}>Contact Us</h2>
            <p className={styles.text}>
              If you have questions about this Privacy Policy, please contact us at privacy@dseller.com
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

