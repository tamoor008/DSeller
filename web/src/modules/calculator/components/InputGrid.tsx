import { ChangeEvent, useEffect, useState } from 'react';
import { COMMISSION_GROUPS, COMMISSION_OPTIONS } from '../constants/commissions';
import { CalculatorFormData } from '../types';
import styles from '../styles/calculator.module.css';

interface InputGridProps {
  formData: CalculatorFormData;
  updateField: <K extends keyof CalculatorFormData>(
    field: K,
    value: CalculatorFormData[K],
  ) => void;
  onCategoryChange: (categoryId: string) => void;
  onCalculate: () => void;
  selectedCategoryLabel: string;
}

const FIELD_CONFIG: Array<{
  label: string;
  field: keyof CalculatorFormData;
  step?: string;
}> = [
  { label: 'Daraz Commission %', field: 'darazCommission', step: '0.1' },
  { label: 'Payment Handling Fee %', field: 'paymentHandlingFee', step: '0.01' },
  { label: 'Selling Price (Rs.)', field: 'sellingPrice', step: '0.01' },
  { label: 'VAT %', field: 'vat', step: '0.1' },
  { label: 'Shipping Charges (Rs.)', field: 'shippingCharges', step: '0.01' },
  { label: 'Purchasing Price (Rs.)', field: 'purchasingPrice', step: '0.01' },
  { label: 'Extra Charges (Rs.)', field: 'extraCharges', step: '0.01' },
  { label: 'Packing Price (Rs.)', field: 'packingPrice', step: '0.01' },
  { label: 'Order Handling Price (auto)', field: 'orderHandlingPrice', step: '0.01' },
];

const SWITCH_CONFIG: Array<{
  label: string;
  field: 'freeShippingMax' | 'voucherMax' | 'incomeTaxWithholding' | 'salesTaxWithholding';
  helper: string;
  impact: string;
}> = [
  {
    label: 'Free Shipping Max',
    field: 'freeShippingMax',
    helper: 'Deduct an additional 6% to absorb platform shipping promos.',
    impact: '−6%',
  },
  {
    label: 'Voucher Max',
    field: 'voucherMax',
    helper: 'Reserve 2% for campaign voucher top-ups.',
    impact: '−2%',
  },
  {
    label: 'Income Tax Withholding',
    field: 'incomeTaxWithholding',
    helper: 'Daraz withholds 2% of the product price; rounded to PKR.',
    impact: '−2%',
  },
  {
    label: 'Sales Tax Withholding',
    field: 'salesTaxWithholding',
    helper: 'Another 2% deduction on product price; rounded.',
    impact: '−2%',
  },
];

export const InputGrid = ({
  formData,
  updateField,
  onCategoryChange,
  onCalculate,
  selectedCategoryLabel,
}: InputGridProps) => {
  const [categoryQuery, setCategoryQuery] = useState(selectedCategoryLabel);

  useEffect(() => {
    setCategoryQuery(selectedCategoryLabel);
  }, [selectedCategoryLabel]);

  const handleNumberChange =
    (field: keyof CalculatorFormData) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '') {
        updateField(field, '' as CalculatorFormData[typeof field]);
        return;
      }

      const nextValue = parseFloat(value);
      if (Number.isNaN(nextValue)) {
        return;
      }
      updateField(field, nextValue as CalculatorFormData[typeof field]);
    };

  const handleToggle = (
    field: 'freeShippingMax' | 'voucherMax' | 'incomeTaxWithholding' | 'salesTaxWithholding',
  ) => {
    updateField(field, !formData[field]);
  };

  const handleCategoryInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCategoryQuery(value);

    const match = COMMISSION_OPTIONS.find(
      (option) =>
        option.pathLabel.toLowerCase() === value.toLowerCase() ||
        option.label.toLowerCase() === value.toLowerCase(),
    );

    if (match) {
      onCategoryChange(match.id);
    }
  };

  const resetCategoryInput = () => {
    setCategoryQuery(selectedCategoryLabel);
  };

  return (
    <section className={styles.inputCard}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>Inputs</p>
          <h2>Order Parameters</h2>
          <p>Fine-tune the assumptions for your Daraz listing.</p>
        </div>
      </div>

      <div className={styles.categorySelect}>
        <label>
          <span>Category (type to search or pick)</span>
          <input
            type="text"
            list="commission-category-options"
            value={categoryQuery}
            onChange={handleCategoryInput}
            onBlur={resetCategoryInput}
            placeholder="e.g. Electronics > Cameras > DSLR"
          />
        </label>
        <datalist id="commission-category-options">
          {Object.entries(COMMISSION_GROUPS).map(([group, options]) =>
            options.map((option) => (
              <option
                key={option.id}
                value={option.pathLabel}
                label={`${group} · ${option.label}`}
              />
            )),
          )}
        </datalist>
      </div>

      <div className={styles.formGrid}>
        {FIELD_CONFIG.map(({ label, field, step }) => (
          <label key={field} className={styles.formControl}>
            <span>{label}</span>
            <input
              type="number"
              value={formData[field]}
              step={step}
              onChange={handleNumberChange(field)}
            />
          </label>
        ))}
      </div>

      <div className={styles.switchGrid}>
        {SWITCH_CONFIG.map(({ label, field, helper, impact }) => (
          <div key={field} className={styles.switchControl}>
            <div>
              <p className={styles.switchLabel}>{label}</p>
              <p className={styles.switchHelper}>{helper}</p>
            </div>
            <div className={styles.switchAction}>
              <span>{impact}</span>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={formData[field]}
                  onChange={() => handleToggle(field)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={styles.calculateButton} onClick={onCalculate}>
        Calculate Profit
      </button>
    </section>
  );
};

