import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CalculatedValues } from '../types';
import { AppColors } from '../../../constants/AppColors';
import TextComp from '../../../ui/components/TextComp';

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
  <View style={styles.container}>
    <View style={styles.header}>
      <TextComp size={12} style={styles.eyebrow} numberOfLines={1}>RESULTS</TextComp>
      <TextComp size={20} style={styles.title} numberOfLines={1}>Profitability</TextComp>
      <TextComp size={14} style={styles.subtitle} numberOfLines={2}>Live ROI snapshot for your configured listing.</TextComp>
    </View>

    <View style={styles.resultList}>
      <View style={styles.resultRow}>
        <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Category</TextComp>
        <TextComp size={14} style={styles.resultValue} numberOfLines={2}>{categoryLabel}</TextComp>
      </View>
      <View style={styles.resultRow}>
        <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Shipping Charges + VAT</TextComp>
        <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
          {formatBreakdown(calculated.shippingCharge, calculated.shippingVatCharges)}
        </TextComp>
      </View>
      <View style={styles.resultRow}>
        <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Daraz Commission + VAT</TextComp>
        <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
          {formatBreakdown(calculated.commissionAmount, calculated.commissionVatShare)}
        </TextComp>
      </View>
      <View style={styles.resultRow}>
        <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Payment Handling Fee + VAT</TextComp>
        <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
          {formatBreakdown(calculated.paymentHandlingAmount, calculated.paymentHandlingVatShare)}
        </TextComp>
      </View>
      <View style={styles.resultRow}>
        <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Handling Fee + VAT</TextComp>
        <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
          {formatBreakdown(calculated.orderHandlingCharge, calculated.orderHandlingVatCharges)}
        </TextComp>
      </View>
      {calculated.freeShippingCharge > 0 && (
        <View style={styles.resultRow}>
          <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Free Shipping Max (6%) + VAT</TextComp>
          <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
            {formatBreakdown(calculated.freeShippingCharge, calculated.freeShippingVatCharges)}
          </TextComp>
        </View>
      )}
      {calculated.voucherCharge > 0 && (
        <View style={styles.resultRow}>
          <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Voucher Max (2%) + VAT</TextComp>
          <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
            {formatBreakdown(calculated.voucherCharge, calculated.voucherVatCharges)}
          </TextComp>
        </View>
      )}
      {calculated.incomeTaxWithholding > 0 && (
        <View style={styles.resultRow}>
          <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Income Tax Withholding (2%)</TextComp>
          <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
            {formatBreakdown(calculated.incomeTaxWithholding)}
          </TextComp>
        </View>
      )}
      {calculated.salesTaxWithholding > 0 && (
        <View style={styles.resultRow}>
          <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Sales Tax Withholding (2%)</TextComp>
          <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
            {formatBreakdown(calculated.salesTaxWithholding)}
          </TextComp>
        </View>
      )}
      <View style={styles.resultRow}>
        <TextComp size={14} style={styles.resultLabel} numberOfLines={2}>Daraz Charges (base)</TextComp>
        <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
          {currency.format(calculated.darazCharges)}
        </TextComp>
      </View>
      <View style={styles.resultRow}>
        <TextComp size={14} style={styles.resultLabel} numberOfLines={1}>Net</TextComp>
        <TextComp size={14} style={styles.resultValue} numberOfLines={1}>
          {currency.format(calculated.net)}
        </TextComp>
      </View>
      <View style={styles.resultRowHighlight}>
        <View style={styles.highlightItem}>
          <TextComp size={14} style={styles.highlightLabel} numberOfLines={1}>Profit</TextComp>
          <View style={styles.highlightValueContainer}>
            <TextComp size={18} style={styles.highlightValue} numberOfLines={1}>
              {currency.format(calculated.profit)}
            </TextComp>
            <TextComp size={14} style={[
              styles.highlightPercent,
              calculated.profitMargin >= 0 ? styles.positive : styles.negative,
              { marginLeft: 8 }
            ]} numberOfLines={1}>
              ({percent.format(calculated.profitMargin / 100)})
            </TextComp>
          </View>
        </View>
        <View style={styles.highlightItem}>
          <TextComp size={14} style={styles.highlightLabel} numberOfLines={1}>ROI</TextComp>
          <TextComp size={18} style={[
            styles.highlightValue,
            calculated.roi >= 0 ? styles.positive : styles.negative
          ]} numberOfLines={1}>
            {percent.format(calculated.roi / 100)}
          </TextComp>
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4338ca',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#c7d2fe',
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    color: AppColors.white,
    marginBottom: 4,
  },
  subtitle: {
    color: '#e0e7ff',
  },
  resultList: {
    // Removed maxHeight since parent ScrollView handles scrolling
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  resultLabel: {
    color: '#c7d2fe',
    fontWeight: '500',
    flex: 1,
  },
  resultValue: {
    color: AppColors.white,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  resultRowHighlight: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  highlightItem: {
    marginBottom: 16,
  },
  highlightLabel: {
    color: '#c7d2fe',
    fontWeight: '500',
  },
  highlightValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  highlightValue: {
    color: AppColors.white,
    fontWeight: '700',
  },
  highlightPercent: {
    fontWeight: '600',
  },
  positive: {
    color: '#34d399',
  },
  negative: {
    color: '#f87171',
  },
});

