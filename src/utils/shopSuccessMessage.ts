export type TransactionKind = 'purchase' | 'sale';

export function subjectParticle(name: string): '이' | '가' {
  const last = name.trim().charCodeAt(name.trim().length - 1);
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? '이' : '가';
}

export function successMessage(name: string, kind: TransactionKind): string {
  return `${name.trim()}${subjectParticle(name)} 성공적으로 ${kind === 'purchase' ? '구매' : '판매'}되었어요!`;
}
