import { useEffect, useState } from 'react';
import { DEFAULT_FORM_DATA } from '../constants/presets';
import { getCommissionOption } from '../constants/commissions';
import { getHandlingFeeForPrice } from '../constants/handlingFee';
import { calculateDerivedValues } from '../utils/calculations';
import { parseNumericInput } from '../utils/numeric';
import { CalculatorFormData, CalculatedValues } from '../types';

export const useCalculator = () => {
  const [formData, setFormData] = useState<CalculatorFormData>(DEFAULT_FORM_DATA);
  const [calculated, setCalculated] = useState<CalculatedValues>(() =>
    calculateDerivedValues(DEFAULT_FORM_DATA),
  );

  const updateField = <K extends keyof CalculatorFormData>(
    field: K,
    value: CalculatorFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === 'number' && Number.isNaN(value) ? ('' as CalculatorFormData[K]) : value,
    }));
  };

  const setCategoryKey = (categoryId: string) => {
    const option = getCommissionOption(categoryId);
    setFormData((prev) => ({
      ...prev,
      categoryKey: option.id,
      darazCommission: option.commission,
    }));
  };

  useEffect(() => {
    const sellingPrice = parseNumericInput(formData.sellingPrice);
    const suggestedFee = getHandlingFeeForPrice(sellingPrice);
    const currentFee = parseNumericInput(formData.orderHandlingPrice);

    if (currentFee === suggestedFee) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      orderHandlingPrice: suggestedFee,
    }));
  }, [formData.sellingPrice]);

  const calculate = () => {
    setCalculated(calculateDerivedValues(formData));
  };

  return {
    formData,
    calculated,
    updateField,
    setCategoryKey,
    calculate,
  };
};

