// src/lib/formatPrice.ts

export function formatPrice(price: number | string | null | undefined) {
  const numericPrice = Number(price);
  const safePrice = Number.isFinite(numericPrice) ? numericPrice : 0;

  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(safePrice);
}