import { CalculatorFormData } from '../types';

export const parseNumericInput = (
  value: CalculatorFormData[keyof CalculatorFormData],
): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

