import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useCalculator } from '../hooks/useCalculator';
import { InputGrid } from './InputGrid';
import { ResultsPanel } from './ResultsPanel';
import { getCommissionOption } from '../constants/commissions';

interface CalculatorModuleProps {
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export const CalculatorModule = ({ scrollViewRef }: CalculatorModuleProps) => {
  const { theme } = useTheme();
  const { formData, calculated, updateField, setCategoryKey, calculate } = useCalculator();
  const selectedCategory = getCommissionOption(formData.categoryKey);

  const handleCalculate = () => {
    calculate();
    // Scroll to end after calculation to show results
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const styles = getStyles(theme);
  return (
    <View style={styles.container}>
      <InputGrid
        formData={formData}
        updateField={updateField}
        onCategoryChange={setCategoryKey}
        onCalculate={handleCalculate}
        selectedCategoryLabel={selectedCategory.pathLabel}
      />
      <View style={{ marginTop: 16 }}>
        <ResultsPanel calculated={calculated} categoryLabel={selectedCategory.pathLabel} />
      </View>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.bgcolor,
  },
});

