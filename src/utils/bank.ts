import type { BankProduct } from '../constants/bank';

/** Frontend-only virtual simple-interest estimate; floor once at maturity. */
export function estimateBankMaturity(
  product: BankProduct,
  amount: number,
  months: number,
): number | null {
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    product.minimumAmount === null ||
    amount < product.minimumAmount ||
    !product.termMonths?.includes(months) ||
    product.annualRate === null
  )
    return null;
  const principal = BigInt(amount) * BigInt(product.kind === 'installment' ? months : 1);
  const percent = BigInt(Math.round(product.annualRate * 100));
  const interest =
    product.kind === 'installment'
      ? (BigInt(amount) * percent * BigInt(months) * BigInt(months + 1)) / BigInt(2400)
      : (BigInt(amount) * percent * BigInt(months)) / BigInt(1200);
  const total = principal + interest;
  return total <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(total) : null;
}

export interface MockBankSubscription {
  mode: 'mock';
  productId: string;
  productName: string;
  amount: number;
  termMonths: number;
  expectedMaturity: number;
}

export function createMockBankSubscription(
  product: BankProduct,
  amount: number,
  months: number,
  balance: number,
): MockBankSubscription | null {
  const expectedMaturity = estimateBankMaturity(product, amount, months);
  if (expectedMaturity === null || amount > balance) return null;
  return {
    mode: 'mock',
    productId: product.id,
    productName: product.name,
    amount,
    termMonths: months,
    expectedMaturity,
  };
}
