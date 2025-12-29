import { CalculatorFormData, CalculatedValues } from '../types';
import { parseNumericInput } from './numeric';

export const calculateDerivedValues = (data: CalculatorFormData): CalculatedValues => {
  const sellingPrice = parseNumericInput(data.sellingPrice);
  const vatRate = parseNumericInput(data.vat) / 100;
  const darazCommission = parseNumericInput(data.darazCommission);
  const paymentHandlingFee = parseNumericInput(data.paymentHandlingFee);
  const shippingCharges = parseNumericInput(data.shippingCharges);
  const packingPrice = parseNumericInput(data.packingPrice);
  const orderHandlingPrice = parseNumericInput(data.orderHandlingPrice);
  const extraCharges = parseNumericInput(data.extraCharges);
  const purchasingPrice = parseNumericInput(data.purchasingPrice);

  const vatCharges = 0; // No VAT on selling price
  const commissionAmount = (sellingPrice * darazCommission) / 100;
  const paymentHandlingAmount = (sellingPrice * paymentHandlingFee) / 100;
  const darazCharges = commissionAmount + paymentHandlingAmount;
  const shippingVatCharges = shippingCharges * vatRate;
  const commissionVatCharges = darazCharges * vatRate;
  const freeShippingCharge = data.freeShippingMax ? sellingPrice * 0.06 : 0;
  const voucherCharge = data.voucherMax ? sellingPrice * 0.02 : 0;
  const freeShippingVatCharges = freeShippingCharge * vatRate;
  const voucherVatCharges = voucherCharge * vatRate;
  const orderHandlingVatCharges = orderHandlingPrice * vatRate;
  const shippingCharge = shippingCharges;
  const orderHandlingCharge = orderHandlingPrice;
  const commissionVatShare =
    darazCharges > 0 ? (commissionAmount / darazCharges) * commissionVatCharges : 0;
  const paymentHandlingVatShare =
    darazCharges > 0 ? (paymentHandlingAmount / darazCharges) * commissionVatCharges : 0;
  const incomeTaxWithholding = data.incomeTaxWithholding
    ? Math.round(sellingPrice * 0.02)
    : 0;
  const salesTaxWithholding = data.salesTaxWithholding ? Math.round(sellingPrice * 0.02) : 0;

  const totalChargesExPacking =
    shippingVatCharges +
    commissionVatCharges +
    darazCharges +
    orderHandlingPrice +
    extraCharges +
    freeShippingCharge +
    voucherCharge +
    freeShippingVatCharges +
    voucherVatCharges +
    orderHandlingVatCharges +
    incomeTaxWithholding +
    salesTaxWithholding;

  const net = sellingPrice - totalChargesExPacking;
  const profit = net - purchasingPrice - packingPrice;
  const investmentBase = purchasingPrice + packingPrice;
  const roi = investmentBase > 0 ? (profit / investmentBase) * 100 : 0;
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  return {
    vatCharges,
    shippingVatCharges,
    commissionVatCharges,
    darazCharges,
    commissionAmount,
    paymentHandlingAmount,
    freeShippingCharge,
    voucherCharge,
    freeShippingVatCharges,
    voucherVatCharges,
    incomeTaxWithholding,
    salesTaxWithholding,
    orderHandlingVatCharges,
    shippingCharge,
    orderHandlingCharge,
    commissionVatShare,
    paymentHandlingVatShare,
    net,
    profit,
    roi,
    profitMargin,
  };
};

