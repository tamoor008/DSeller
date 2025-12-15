import { DEFAULT_COMMISSION_OPTION } from './commissions';
import { CalculatorFormData } from '../types';

export const DEFAULT_FORM_DATA: CalculatorFormData = {
  darazCommission: DEFAULT_COMMISSION_OPTION.commission,
  paymentHandlingFee: 2.25,
  sellingPrice: 0,
  vat: 16,
  shippingCharges: 0,
  purchasingPrice: 0,
  extraCharges: 0,
  packingPrice: 0,
  orderHandlingPrice: 5,
  freeShippingMax: false,
  voucherMax: false,
  incomeTaxWithholding: true,
  salesTaxWithholding: true,
  categoryKey: DEFAULT_COMMISSION_OPTION.id,
};

