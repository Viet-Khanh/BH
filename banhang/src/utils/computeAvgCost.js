export const computeAvgCost = (oldQty, oldAvgCost, inQty, inCost) => {
  const totalQty = Number(oldQty) + Number(inQty);
  if (totalQty <= 0) return Number(oldAvgCost) || Number(inCost) || 0;
  const totalCost =
    Number(oldQty) * Number(oldAvgCost || 0) +
    Number(inQty) * Number(inCost || 0);
  return Math.round(totalCost / totalQty);
};
