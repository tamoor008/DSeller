const HANDLING_FEE_BRACKETS = [
  { max: 0, fee: 0 },
  { max: 500, fee: 10 },
  { max: 1000, fee: 15 },
  { max: 2000, fee: 20 },
  { max: Infinity, fee: 60 },
] as const;

export const getHandlingFeeForPrice = (price: number): number => {
  if (price <= 0) {
    return 0;
  }

  const bracket = HANDLING_FEE_BRACKETS.find(({ max }) => price <= max);
  return bracket ? bracket.fee : 0;
};

