export interface ShopProduct {
  id: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  category: 'hat' | 'face';
  image: string;
  description: string;
}

const image = (filename: string) => `/assets/items/${encodeURIComponent(filename)}`;

// First five purchase prices come from the reference PNGs.
// Other purchase prices are mock data. Sales refund the full purchase price.
export const shopProducts: readonly ShopProduct[] = [
  {
    id: 'straw',
    name: '밀짚모자',
    purchasePrice: 500,
    salePrice: 500,
    category: 'hat',
    image: image('hat-straw.svg'),
    description: '햇빛을 가려주는 여름 모자예요',
  },
  {
    id: 'crown',
    name: '왕관',
    purchasePrice: 1100,
    salePrice: 1100,
    category: 'hat',
    image: image('hat-crown.svg'),
    description: '반짝이는 보석이 달린 왕관이에요',
  },
  {
    id: 'ribbon',
    name: '리본 헤어핀',
    purchasePrice: 400,
    salePrice: 400,
    category: 'hat',
    image: image('ribbon-bow.svg'),
    description: '분홍색 리본으로 꾸며보세요',
  },
  {
    id: 'round',
    name: '동그란 안경',
    purchasePrice: 1200,
    salePrice: 1200,
    category: 'face',
    image: image('glasses-round.svg'),
    description: '똑똑해보이는 귀여운 안경이에요',
  },
  {
    id: 'sun',
    name: '선글라스',
    purchasePrice: 900,
    salePrice: 900,
    category: 'face',
    image: image('glasses-sun.svg'),
    description: '눈부신 햇빛을 가려주는 선글라스예요',
  },
  {
    id: 'wizard',
    name: '별빛 마법사 모자',
    purchasePrice: 1200,
    salePrice: 1200,
    category: 'hat',
    image: image('hat-wizard.svg'),
    description: '별빛을 담은 마법사 모자예요',
  },
  {
    id: 'angel',
    name: '천사 링',
    purchasePrice: 600,
    salePrice: 600,
    category: 'hat',
    image: image('angel-ring.svg'),
    description: '머리 위에서 빛나는 천사 링이에요',
  },
  {
    id: 'heart',
    name: '하트 선글라스',
    purchasePrice: 400,
    salePrice: 400,
    category: 'face',
    image: image('glasses-heart.svg'),
    description: '하트 모양의 귀여운 선글라스예요',
  },
];

export const findProduct = (id: string) => shopProducts.find((product) => product.id === id);
