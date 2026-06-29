/** Public pricing — keep in sync with Stripe EUR prices. */
export const CURRENCY = "EUR";
export const CURRENCY_SYMBOL = "€";

export const PRO_PRICE_MONTHLY = 9;
export const PRO_PRICE_YEARLY_PER_MONTH = 7;
export const PRO_PRICE_YEARLY_TOTAL = 84;

export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount}`;
}
