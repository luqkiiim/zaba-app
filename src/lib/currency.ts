type CurrencyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatCurrency(
  amount: number,
  { minimumFractionDigits = 2, maximumFractionDigits = 2 }: CurrencyFormatOptions = {},
) {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits,
    maximumFractionDigits,
  })}`;
}
