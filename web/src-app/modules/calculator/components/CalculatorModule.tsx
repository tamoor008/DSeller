import { useRef } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { InputGrid } from './InputGrid';
import { ResultsPanel } from './ResultsPanel';
import { getCommissionOption } from '../constants/commissions';
import styles from '../styles/calculator.module.css';

export const CalculatorModule = () => {
  const { formData, calculated, updateField, setCategoryKey, calculate } = useCalculator();
  const selectedCategory = getCommissionOption(formData.categoryKey);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const handleCalculate = () => {
    calculate();
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className={styles.calculatorShell}>
      <div className={styles.grid}>
        <InputGrid
          formData={formData}
          updateField={updateField}
          onCategoryChange={setCategoryKey}
          onCalculate={handleCalculate}
          selectedCategoryLabel={selectedCategory.pathLabel}
        />
        <div ref={resultsRef}>
          <ResultsPanel calculated={calculated} categoryLabel={selectedCategory.pathLabel} />
        </div>
      </div>
    </section>
  );
};

