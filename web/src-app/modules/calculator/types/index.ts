type NumericValue = number | '';

export interface CalculatorFormData {
  darazCommission: NumericValue;
  paymentHandlingFee: NumericValue;
  sellingPrice: NumericValue;
  vat: NumericValue;
  shippingCharges: NumericValue;
  purchasingPrice: NumericValue;
  extraCharges: NumericValue;
  packingPrice: NumericValue;
  orderHandlingPrice: NumericValue;
  freeShippingMax: boolean;
  voucherMax: boolean;
  incomeTaxWithholding: boolean;
  salesTaxWithholding: boolean;
  categoryKey: string;
}

export interface CalculatedValues {
  vatCharges: number;
  shippingVatCharges: number;
  commissionVatCharges: number;
  darazCharges: number;
  commissionAmount: number;
  paymentHandlingAmount: number;
  freeShippingCharge: number;
  voucherCharge: number;
  freeShippingVatCharges: number;
  voucherVatCharges: number;
  incomeTaxWithholding: number;
  salesTaxWithholding: number;
  orderHandlingVatCharges: number;
  shippingCharge: number;
  orderHandlingCharge: number;
  commissionVatShare: number;
  paymentHandlingVatShare: number;
  net: number;
  profit: number;
  roi: number;
  profitMargin: number;
}

export interface CommissionNode {
  name: string;
  commission?: number;
  children?: CommissionNode[];
}

export interface CommissionOption {
  id: string;
  label: string;
  pathLabel: string;
  commission: number;
  group: string;
}

