export function formatPrice(price: number) {
  const safePrice = Number.isFinite(Number(price)) ? Number(price) : 0;

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(safePrice);
}
