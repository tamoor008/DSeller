import { CalculatedValues } from '../types';
import styles from '../styles/calculator.module.css';

interface ResultsPanelProps {
  calculated: CalculatedValues;
  categoryLabel: string;
}

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});

const formatBreakdown = (base: number, vat?: number) => {
  if (vat && vat > 0) {
    return `${currency.format(base)} + ${currency.format(vat)} = ${currency.format(base + vat)}`;
  }
  return currency.format(base);
};

export const ResultsPanel = ({ calculated, categoryLabel }: ResultsPanelProps) => (
  <section className={styles.resultsCard}>
    <div className={styles.cardHeader}>
      <div>
        <p className={styles.eyebrow}>Results</p>
        <h2>Profitability</h2>
        <p>Live ROI snapshot for your configured listing.</p>
      </div>
    </div>

    <div className={styles.resultList}>
      <div className={styles.resultRow}>
        <span>Category</span>
        <strong>{categoryLabel}</strong>
      </div>
      <div className={styles.resultRow}>
        <span>Shipping Charges + VAT</span>
        <strong>{formatBreakdown(calculated.shippingCharge, calculated.shippingVatCharges)}</strong>
      </div>
      <div className={styles.resultRow}>
        <span>Daraz Commission + VAT</span>
        <strong>{formatBreakdown(calculated.commissionAmount, calculated.commissionVatShare)}</strong>
      </div>
      <div className={styles.resultRow}>
        <span>Payment Handling Fee + VAT</span>
        <strong>
          {formatBreakdown(calculated.paymentHandlingAmount, calculated.paymentHandlingVatShare)}
        </strong>
      </div>
      <div className={styles.resultRow}>
        <span>Handling Fee + VAT</span>
        <strong>{formatBreakdown(calculated.orderHandlingCharge, calculated.orderHandlingVatCharges)}</strong>
      </div>
      {calculated.freeShippingCharge > 0 && (
        <div className={styles.resultRow}>
          <span>Free Shipping Max (6%) + VAT</span>
          <strong>{formatBreakdown(calculated.freeShippingCharge, calculated.freeShippingVatCharges)}</strong>
        </div>
      )}
      {calculated.voucherCharge > 0 && (
        <div className={styles.resultRow}>
          <span>Voucher Max (2%) + VAT</span>
          <strong>{formatBreakdown(calculated.voucherCharge, calculated.voucherVatCharges)}</strong>
        </div>
      )}
      {calculated.incomeTaxWithholding > 0 && (
        <div className={styles.resultRow}>
          <span>Income Tax Withholding (2%)</span>
          <strong>{formatBreakdown(calculated.incomeTaxWithholding)}</strong>
        </div>
      )}
      {calculated.salesTaxWithholding > 0 && (
        <div className={styles.resultRow}>
          <span>Sales Tax Withholding (2%)</span>
          <strong>{formatBreakdown(calculated.salesTaxWithholding)}</strong>
        </div>
      )}
      <div className={styles.resultRow}>
        <span>Daraz Charges (base)</span>
        <strong>{currency.format(calculated.darazCharges)}</strong>
      </div>
      <div className={styles.resultRow}>
        <span>Net</span>
        <strong>{currency.format(calculated.net)}</strong>
      </div>
      <div className={styles.resultRowHighlight}>
        <div>
          <p>Profit</p>
          <strong>
            {currency.format(calculated.profit)}{' '}
            <span className={calculated.profitMargin >= 0 ? styles.positive : styles.negative}>
              ({percent.format(calculated.profitMargin / 100)})
            </span>
          </strong>
        </div>
        <div>
          <p>ROI</p>
          <strong className={calculated.roi >= 0 ? styles.positive : styles.negative}>
            {percent.format(calculated.roi / 100)}
          </strong>
        </div>
      </div>
    </div>
  </section>
);

