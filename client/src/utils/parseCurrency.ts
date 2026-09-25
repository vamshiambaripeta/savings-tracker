export const parseCurrency = (val: string | undefined): number => {
  if (!val) return 0;

  // Handle formatted negative values like "-3,672.90" or "($3,324.98)"
  const cleaned = val.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
};
