'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { APP_ROUTES } from '../config/constants'

export default function Calculator() {
  const [sellingPrice, setSellingPrice] = useState('')
  const [purchasingPrice, setPurchasingPrice] = useState('')
  const [darazCommission, setDarazCommission] = useState('12')
  const [shippingCharges, setShippingCharges] = useState('0')
  const [packingPrice, setPackingPrice] = useState('0')
  const [results, setResults] = useState<{
    revenue: number
    totalCosts: number
    profit: number
    profitMargin: number
  } | null>(null)

  const calculate = () => {
    const sell = parseFloat(sellingPrice) || 0
    const purchase = parseFloat(purchasingPrice) || 0
    const commission = parseFloat(darazCommission) || 0
    const shipping = parseFloat(shippingCharges) || 0
    const packing = parseFloat(packingPrice) || 0

    if (sell === 0 || purchase === 0) {
      alert('Please enter selling price and purchasing price')
      return
    }

    const commissionAmount = (sell * commission) / 100
    const totalCosts = purchase + commissionAmount + shipping + packing
    const revenue = sell - commissionAmount
    const profit = revenue - purchase - shipping - packing
    const profitMargin = (profit / sell) * 100

    setResults({
      revenue,
      totalCosts,
      profit,
      profitMargin,
    })
  }

  return (
    <div className={styles.calculator}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>Daraz Profit Calculator</h1>
          <p className={styles.subtitle}>
            Calculate your profit margins and make informed pricing decisions
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.calculatorWrapper}>
            <div className={styles.inputSection}>
              <h2 className={styles.sectionTitle}>Enter Product Details</h2>
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label htmlFor="sellingPrice">Selling Price (Rs.)</label>
                  <input
                    type="number"
                    id="sellingPrice"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="purchasingPrice">Purchasing Price (Rs.)</label>
                  <input
                    type="number"
                    id="purchasingPrice"
                    value={purchasingPrice}
                    onChange={(e) => setPurchasingPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="darazCommission">Daraz Commission (%)</label>
                  <input
                    type="number"
                    id="darazCommission"
                    value={darazCommission}
                    onChange={(e) => setDarazCommission(e.target.value)}
                    placeholder="12"
                    step="0.1"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="shippingCharges">Shipping Charges (Rs.)</label>
                  <input
                    type="number"
                    id="shippingCharges"
                    value={shippingCharges}
                    onChange={(e) => setShippingCharges(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="packingPrice">Packing Price (Rs.)</label>
                  <input
                    type="number"
                    id="packingPrice"
                    value={packingPrice}
                    onChange={(e) => setPackingPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <button onClick={calculate} className={styles.calculateBtn}>
                Calculate Profit
              </button>
            </div>

            {results && (
              <div className={styles.resultsSection}>
                <h2 className={styles.sectionTitle}>Results</h2>
                <div className={styles.resultsGrid}>
                  <div className={styles.resultCard}>
                    <div className={styles.resultLabel}>Revenue</div>
                    <div className={styles.resultValue}>
                      Rs. {results.revenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className={styles.resultCard}>
                    <div className={styles.resultLabel}>Total Costs</div>
                    <div className={styles.resultValue}>
                      Rs. {results.totalCosts.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className={`${styles.resultCard} ${styles.resultCardProfit}`}>
                    <div className={styles.resultLabel}>Profit</div>
                    <div className={`${styles.resultValue} ${results.profit >= 0 ? styles.profitPositive : styles.profitNegative}`}>
                      Rs. {results.profit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className={styles.resultCard}>
                    <div className={styles.resultLabel}>Profit Margin</div>
                    <div className={`${styles.resultValue} ${results.profitMargin >= 0 ? styles.profitPositive : styles.profitNegative}`}>
                      {results.profitMargin.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.upgradeSection}>
            <h2 className={styles.upgradeTitle}>Want More Advanced Features?</h2>
            <p className={styles.upgradeDescription}>
              Get access to our full calculator with category-specific commissions, handling fees, 
              VAT calculations, and advanced scenarios for FBM and FBD.
            </p>
            <div className={styles.upgradeFeatures}>
              <div className={styles.upgradeFeature}>✓ Category-specific commission rates</div>
              <div className={styles.upgradeFeature}>✓ Automatic handling fee calculation</div>
              <div className={styles.upgradeFeature}>✓ VAT and tax calculations</div>
              <div className={styles.upgradeFeature}>✓ FBM and FBD scenario testing</div>
              <div className={styles.upgradeFeature}>✓ Save and compare multiple products</div>
            </div>
            <a href={APP_ROUTES.SIGNUP} className={styles.upgradeBtn}>
              Sign Up for Full Access
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

