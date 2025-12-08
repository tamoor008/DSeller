import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useCalculator } from '../hooks/useCalculator';
import { InputGrid } from './InputGrid';
import { ResultsPanel } from './ResultsPanel';
import { getCommissionOption } from '../constants/commissions';

export const CalculatorModule = () => {
  const { formData, calculated, updateField, setCategoryKey, calculate } = useCalculator();
  const selectedCategory = getCommissionOption(formData.categoryKey);
  const resultsRef = useRef<ScrollView | null>(null);

  const handleCalculate = () => {
    calculate();
    resultsRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <ScrollView style={{ flex: 1 }} ref={resultsRef}>
      <View style={{ padding: 16 }}>
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
    </ScrollView>
  );
};

