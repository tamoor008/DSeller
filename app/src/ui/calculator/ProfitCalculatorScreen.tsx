import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CalculatorModule } from '../../modules/calculator';
import { AppColors } from '../../constants/AppColors';
import Header from '../components/Header';
import TextComp from '../components/TextComp';

const ProfitCalculatorScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header
        title="Profit Calculator"
        goBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <TextComp size={12} style={styles.eyebrow}>
            DARAZ SELLER TOOLKIT
          </TextComp>
          <TextComp size={20} style={styles.title}>
            Daraz Profit Calculator
          </TextComp>
          <TextComp size={14} style={styles.subtitle}>
            Stress-test both FBM and FBD scenarios with smart presets, instant ROI, and category-specific
            commissions pulled straight from the Daraz sheet.
          </TextComp>
        </View>
        <CalculatorModule />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgcolor,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: AppColors.textSecondary,
  },
});

export default ProfitCalculatorScreen;

