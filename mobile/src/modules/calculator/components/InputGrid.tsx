import React, { useState, useEffect } from 'react';
import { View, TextInput, Switch, TouchableOpacity, StyleSheet, Modal, FlatList, Text } from 'react-native';
import { CalculatorFormData } from '../types';
import { COMMISSION_OPTIONS } from '../constants/commissions';
import { useTheme } from '../../../context/ThemeContext';
import TextComp from '../../../ui/components/TextComp';

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

const FIELD_CONFIG: Array<{ label: string; field: keyof CalculatorFormData; step?: string }> = [
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
  const { theme } = useTheme();
  const [categoryQuery, setCategoryQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState(COMMISSION_OPTIONS);

  useEffect(() => {
    if (categoryQuery.trim() === '') {
      setFilteredCategories(COMMISSION_OPTIONS);
    } else {
      const filtered = COMMISSION_OPTIONS.filter(
        (option) =>
          option.pathLabel.toLowerCase().includes(categoryQuery.toLowerCase()) ||
          option.label.toLowerCase().includes(categoryQuery.toLowerCase()),
      );
      setFilteredCategories(filtered);
    }
  }, [categoryQuery]);

  const handleNumberChange = (field: keyof CalculatorFormData) => (text: string) => {
    if (text === '') {
      updateField(field, '' as CalculatorFormData[typeof field]);
      return;
    }

    const nextValue = parseFloat(text);
    if (!Number.isNaN(nextValue)) {
      updateField(field, nextValue as CalculatorFormData[typeof field]);
    }
  };

  const handleToggle = (
    field: 'freeShippingMax' | 'voucherMax' | 'incomeTaxWithholding' | 'salesTaxWithholding',
  ) => {
    updateField(field, !formData[field]);
  };

  const handleCategorySelect = (option: typeof COMMISSION_OPTIONS[0]) => {
    onCategoryChange(option.id);
    setCategoryQuery(option.pathLabel);
    setShowCategoryModal(false);
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextComp size={12} style={styles.eyebrow} numberOfLines={1}>INPUTS</TextComp>
        <TextComp size={20} style={styles.title} numberOfLines={1}>Order Parameters</TextComp>
        <TextComp size={14} style={styles.subtitle} numberOfLines={2}>Fine-tune the assumptions for your Daraz listing.</TextComp>
      </View>

      <View style={styles.categorySelect}>
        <TextComp size={14} style={styles.label} numberOfLines={1}>Category</TextComp>
        <TouchableOpacity
          style={styles.categoryInput}
          onPress={() => setShowCategoryModal(true)}
        >
          <TextComp size={16} style={styles.categoryText} numberOfLines={1}>
            {selectedCategoryLabel || 'Select category...'}
          </TextComp>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TextComp size={18} style={styles.modalTitle} numberOfLines={1}>Select Category</TextComp>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <TextComp size={16} style={styles.closeButton} numberOfLines={1}>Close</TextComp>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search category..."
              placeholderTextColor={theme.textSecondary}
              value={categoryQuery}
              onChangeText={setCategoryQuery}
            />
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(item)}
                >
                  <TextComp size={14} style={styles.categoryItemLabel} numberOfLines={2}>{item.pathLabel}</TextComp>
                  <TextComp size={12} style={styles.categoryItemCommission} numberOfLines={1}>
                    {item.commission}%
                  </TextComp>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.formGrid}>
        {FIELD_CONFIG.map(({ label, field }, index) => (
          <View key={field} style={[
            styles.formControl,
            index % 2 === 0 && styles.formControlLeft,
            index % 2 === 1 && styles.formControlRight,
          ]}>
            <TextComp size={14} style={styles.label} numberOfLines={1}>{label}</TextComp>
            <TextInput
              style={styles.input}
              value={formData[field]?.toString() || ''}
              onChangeText={handleNumberChange(field)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        ))}
      </View>

      <View style={styles.switchGrid}>
        {SWITCH_CONFIG.map(({ label, field, helper, impact }) => (
          <View key={field} style={[styles.switchControl, { marginBottom: 12 }]}>
            <View style={styles.switchInfo}>
              <TextComp size={14} style={styles.switchLabel} numberOfLines={1}>{label}</TextComp>
              <TextComp size={12} style={styles.switchHelper} numberOfLines={2}>{helper}</TextComp>
            </View>
            <View style={styles.switchAction}>
              <TextComp size={14} style={styles.impact} numberOfLines={1}>{impact}</TextComp>
              <Switch
                value={formData[field]}
                onValueChange={() => handleToggle(field)}
                trackColor={{ false: theme.border, true: theme.primaryOrange }}
                thumbColor={theme.white}
              />
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={onCalculate}>
        <TextComp size={16} style={styles.calculateButtonText} numberOfLines={1}>Calculate Profit</TextComp>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.card,
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
    color: theme.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.textSecondary,
  },
  categorySelect: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  categoryInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.card,
  },
  categoryText: {
    color: theme.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '700',
    color: theme.textPrimary,
  },
  closeButton: {
    color: theme.primaryOrange,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: theme.textPrimary,
    backgroundColor: theme.bgcolor,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  categoryItemLabel: {
    flex: 1,
    color: theme.textPrimary,
  },
  categoryItemCommission: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  formControl: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  formControlLeft: {
    paddingRight: 3,
  },
  formControlRight: {
    paddingLeft: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.textPrimary,
    backgroundColor: theme.bgcolor,
  },
  switchGrid: {
    marginTop: 16,
  },
  switchControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: theme.bgcolor,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  switchHelper: {
    color: theme.textSecondary,
  },
  switchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  impact: {
    fontWeight: '600',
    color: theme.textPrimary,
  },
  calculateButton: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.primaryOrange,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: theme.white,
    fontWeight: '600',
  },
});

