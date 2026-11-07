export interface BankProduct {
  id: string;
  name: string;
  description: string;
  kind: 'deposit' | 'installment';
  details: {
    guide: string;
    interest: string | null;
    conditions: string | null;
    notes: string | null;
  };
  annualRate: number | null;
  minimumAmount: number | null;
  termMonths: readonly number[] | null;
}

export const bankProductGroups: readonly {
  id: string;
  title: string;
  products: readonly BankProduct[];
}[] = [
  {
    id: 'deposit',
    title: '예금 상품 목록',
    products: [
      {
        id: 'seed',
        kind: 'deposit',
        annualRate: 0.02,
        minimumAmount: 100,
        termMonths: [3, 6, 12],
        details: {
          guide:
            '적은 금액으로도 가볍게 시작할 수 있는 예금이에요. 처음 저금을 배우는 친구들에게 추천해요.',
          interest: '연 2% 단리로 계산해요.',
          conditions: '최소 100코인부터 예치할 수 있어요. 만기는 3/6/12개월이에요.',
          notes:
            '프론트엔드 테스트용 가상 상품입니다. 세금·복리·중도해지는 계산에 반영하지 않아요.',
        },
        name: '새싹 예금',
        description:
          '적은 금액으로도 가볍게 시작할 수 있는 예금이에요. 처음 저금을 배우는 친구들에게 추천해요.',
      },
      {
        id: 'strong',
        kind: 'deposit',
        annualRate: 0.04,
        minimumAmount: 1000,
        termMonths: [6, 12, 24],
        details: {
          guide: '큰 금액을 오래 맡길수록 이자가 더 두둑해져요. 목돈을 모으고 싶을 때 좋아요.',
          interest: '연 4% 단리로 계산해요.',
          conditions: '최소 1,000코인부터 예치할 수 있어요. 만기는 6/12/24개월이에요.',
          notes:
            '프론트엔드 테스트용 가상 상품입니다. 세금·복리·중도해지는 계산에 반영하지 않아요.',
        },
        name: '튼튼 예금',
        description: '큰 금액을 오래 맡길수록 이자가 더 두둑해져요. 목돈을 모으고 싶을 때 좋아요.',
      },
    ],
  },
  {
    id: 'installment',
    title: '적금 상품 목록',
    products: [
      {
        id: 'moamoa',
        kind: 'installment',
        annualRate: 0.03,
        minimumAmount: 100,
        termMonths: [3, 6, 12],
        details: {
          guide: '매달 원하는 만큼 자유롭게 모으는 기본 적금이에요.',
          interest: '연 3% 단리로 계산해요.',
          conditions: '매달 최소 100코인부터 저축할 수 있어요. 만기는 3/6/12개월이에요.',
          notes:
            '프론트엔드 테스트용 가상 상품입니다. 세금·복리·중도해지는 계산에 반영하지 않아요.',
        },
        name: '모아모아 적금',
        description: '매달 원하는 만큼 자유롭게 모으는 기본 적금이에요.',
      },
      {
        id: 'steady',
        kind: 'installment',
        annualRate: 0.06,
        minimumAmount: 300,
        termMonths: [12],
        details: {
          guide: '1년 동안 매달 저축하는 적금이에요. 이자가 가장 높은 상품이에요.',
          interest: '연 6%의 이자가 붙어요. 만기가 되면 모은 코인과 이자를 함께 돌려받아요.',
          conditions: '매달 최소 300코인부터 저축할 수 있어요. 만기는 12개월이에요.',
          notes:
            '프론트엔드 테스트용 가상 상품입니다. 최초 납입액은 월 저축액이며, 실제 차감은 없어요. 세금·복리·중도해지는 계산에 반영하지 않아요.',
        },
        name: '꼬박꼬박 적금',
        description:
          '1년 동안 꾸준히 모으면 가장 높은 이자를 받아요. 습관을 만들고 싶을 때 좋아요.',
      },
    ],
  },
] as const;
