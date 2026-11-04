'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { ItemCard, SellItemCard } from '@/components/shop/ItemCard';
import ShopContainer from '@/components/shop/ShopContainer';
import ShopViewport from '@/components/shop/ShopViewport';
import ShopTransactionModal from '@/components/shop/ShopTransactionModal';
import ShopItemImage from '@/components/shop/ShopItemImage';
import ShopSuccessNotice, { type ShopNotice } from '@/components/shop/ShopSuccessNotice';
import { findProduct, shopProducts, type ShopProduct } from '@/constants/shop';
import { useShopStore } from '@/hooks/useShopStore';

const format = (value: number) => value.toLocaleString('ko-KR');
const CARD_STEP = 340; // 300px card + 40px gap.
type Dialog = { kind: 'purchase' | 'sale'; product: ShopProduct; instanceId?: string };

export default function ShopPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'purchase' | 'sale'>('purchase');
  const listRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState<ShopNotice | null>(null);
  const noticeId = useRef(0);
  const [error, setError] = useState('');
  const inventory = useShopStore((state) => state.inventory);
  const purchase = useShopStore((state) => state.purchase);
  const sell = useShopStore((state) => state.sell);
  const selected = inventory.find((entry) => entry.instanceId === selectedId);
  const selectedProduct = selected && findProduct(selected.productId);
  const count = tab === 'purchase' ? shopProducts.length : inventory.length;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => {
      const nextSize = Math.max(1, Math.floor((list.clientWidth + 40) / CARD_STEP));
      setPageSize(nextSize);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [tab, count]);

  function changeTab(next: 'purchase' | 'sale') {
    setTab(next);
    setPage(1);
    setSelectedId(null);
  }

  function confirm() {
    if (!dialog) return;
    const result =
      dialog.kind === 'purchase' ? purchase(dialog.product.id) : sell(dialog.instanceId!);
    if (!result.ok) {
      setError(
        result.reason === 'insufficient-funds'
          ? '잔액이 부족해요!'
          : result.reason === 'already-owned'
            ? '이미 보유한 아이템입니다.'
            : '보유 아이템을 다시 확인해주세요.',
      );
      return;
    }
    setNotice({
      id: ++noticeId.current,
      kind: dialog.kind,
      itemName: dialog.product.name,
      amount: dialog.kind === 'purchase' ? dialog.product.purchasePrice : dialog.product.salePrice,
    });
    setSelectedId(null);
    setDialog(null);
    setError('');
  }

  return (
    <>
      <ShopViewport>
        <ShopContainer
          aria-label="상점"
          className={`h-[659px] max-lg:h-[668px] ${tab === 'sale' && count > 0 ? 'gap-3! min-lg:gap-4!' : ''}`}
          toolbar={
            <div className="relative flex w-full flex-wrap items-center gap-3 px-5">
              <h1 className="mr-7 text-[40px] leading-[61px] text-black [-webkit-text-stroke:16px_#FFFDF9] [paint-order:stroke_fill]">
                상점
              </h1>
              <div className="flex gap-3" aria-label="상점 메뉴">
                <Button
                  size="tab"
                  variant={tab === 'purchase' ? 'selected' : 'secondary'}
                  aria-pressed={tab === 'purchase'}
                  onClick={() => changeTab('purchase')}
                >
                  구매
                </Button>
                <Button
                  size="tab"
                  variant={tab === 'sale' ? 'selected' : 'secondary'}
                  aria-pressed={tab === 'sale'}
                  onClick={() => changeTab('sale')}
                >
                  판매
                </Button>
              </div>
              {notice && <ShopSuccessNotice key={notice.id} notice={notice} />}
              <Button
                variant="secondary"
                disabled
                className="disabled:ml-auto disabled:border-b-8 disabled:bg-[#e8f4fa] disabled:text-brown-dark"
                title="오늘의 퀴즈는 아직 연결되지 않았어요"
              >
                오늘의 퀴즈 →
              </Button>
            </div>
          }
        >
          {tab === 'purchase' ? (
            <>
              <h2 className="shrink-0 text-[32px] leading-10 text-black">
                현재 판매 중인 아이템 목록
              </h2>
              <div
                ref={listRef}
                className="flex w-full min-w-0 shrink-0 flex-nowrap items-start gap-10"
                tabIndex={0}
                role="region"
                aria-label="구매 아이템 목록"
              >
                {shopProducts.slice(startIndex, startIndex + pageSize).map((product) => {
                  const owned = inventory.some((entry) => entry.productId === product.id);
                  return (
                    <ItemCard key={product.id}>
                      <div className="flex h-[200px] w-full shrink-0 items-center justify-center rounded-[10px] bg-cream [&_img]:h-40 [&_img]:w-40 [&_img]:max-w-full [&_img]:object-contain [&_img]:[image-rendering:pixelated]">
                        <ShopItemImage src={product.image} />
                      </div>
                      <h3 className="text-[28px] leading-[35px] text-black">{product.name}</h3>
                      <div className="flex items-center justify-between text-xl leading-7 text-brown-muted [&_strong]:flex [&_strong]:items-center [&_strong]:gap-2 [&_strong]:text-2xl [&_strong]:font-normal [&_strong]:text-black">
                        <span>가격</span>
                        <strong>
                          <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
                          {format(product.purchasePrice)}
                        </strong>
                      </div>
                      <Button
                        disabled={owned}
                        onClick={() => {
                          setDialog({ kind: 'purchase', product });
                          setError('');
                        }}
                      >
                        {owned ? '보유 중' : '구매하기'}
                      </Button>
                    </ItemCard>
                  );
                })}
              </div>
            </>
          ) : inventory.length === 0 ? (
            <EmptyState
              title="보유한 아이템이 없습니다"
              description="아이템을 보유하면 이곳에서 다시 판매할 수 있어요"
              className="min-h-0! px-0! pt-20! pb-0!"
              action={
                <Button size="empty" onClick={() => changeTab('purchase')}>
                  구매 탭으로 이동
                </Button>
              }
            />
          ) : (
            <>
              <div>
                <h2 className="shrink-0 text-[32px] leading-10 text-black">
                  현재 보유 중인 아이템 목록
                </h2>
                <p className="mt-2 text-[28px] leading-[35px] text-brown-muted">
                  판매할 아이템을 선택하세요
                </p>
              </div>
              <div
                ref={listRef}
                className="flex w-full min-w-0 shrink-0 flex-nowrap items-start gap-10"
                tabIndex={0}
                role="region"
                aria-label="판매 아이템 목록"
              >
                {inventory.slice(startIndex, startIndex + pageSize).map((entry) => {
                  const product = findProduct(entry.productId)!;
                  return (
                    <SellItemCard
                      key={entry.instanceId}
                      selected={selectedId === entry.instanceId}
                      onClick={() =>
                        setSelectedId(selectedId === entry.instanceId ? null : entry.instanceId)
                      }
                      aria-label={`${product.name} 판매 선택`}
                    >
                      <span className="flex h-[200px] w-full shrink-0 items-center justify-center rounded-[10px] bg-cream [&_img]:h-40 [&_img]:w-40 [&_img]:max-w-full [&_img]:object-contain [&_img]:[image-rendering:pixelated]">
                        <ShopItemImage src={product.image} />
                      </span>
                      <span className="text-[28px] leading-[35px] text-black">{product.name}</span>
                    </SellItemCard>
                  );
                })}
              </div>
              <div className="flex min-h-[110px] shrink-0 items-center justify-between gap-5 rounded-[20px] bg-cream p-5 [&_dd]:text-2xl [&_dd]:leading-7 [&_dl]:flex [&_dl]:flex-col [&_dl]:gap-3 [&_dl>div]:flex [&_dl>div]:items-center [&_dl>div]:gap-10 max-lg:[&_dl>div]:gap-4 [&_dt]:shrink-0 [&_dt]:basis-[104px] [&_dt]:text-xl [&_dt]:text-brown-muted max-lg:[&_dt]:basis-20">
                <dl>
                  <div>
                    <dt>선택한 아이템</dt>
                    <dd>{selectedProduct?.name ?? '-'}</dd>
                  </div>
                  <div>
                    <dt>판매 가격</dt>
                    <dd>{selectedProduct ? format(selectedProduct.salePrice) : '-'}</dd>
                  </div>
                </dl>
                <Button
                  disabled={!selectedProduct}
                  className="max-lg:w-[126px]"
                  onClick={() => {
                    if (selectedProduct && selected) {
                      setDialog({
                        kind: 'sale',
                        product: selectedProduct,
                        instanceId: selected.instanceId,
                      });
                      setError('');
                    }
                  }}
                >
                  판매하기
                </Button>
              </div>
            </>
          )}
          {count > 0 && (
            <nav
              className="mt-auto flex items-center justify-center gap-6 text-[28px] leading-[35px] text-brown-muted"
              aria-label="상품 목록 페이지"
            >
              <button
                type="button"
                aria-label="이전 페이지"
                disabled={currentPage === 1}
                className="flex size-11 items-center justify-center rounded-lg focus-visible:outline-3 focus-visible:outline-brown-dark enabled:cursor-pointer disabled:opacity-25 min-lg:absolute min-lg:top-1/2 min-lg:left-3 min-lg:-translate-y-1/2"
                onClick={() => setPage(currentPage - 1)}
              >
                <Image
                  src="/assets/ui/arrow-right.png"
                  width={24}
                  height={30}
                  alt=""
                  className="rotate-180"
                />
              </button>
              <span aria-live="polite" aria-atomic="true">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                aria-label="다음 페이지"
                disabled={currentPage === totalPages}
                className="flex size-11 items-center justify-center rounded-lg focus-visible:outline-3 focus-visible:outline-brown-dark enabled:cursor-pointer disabled:opacity-25 min-lg:absolute min-lg:top-1/2 min-lg:right-3 min-lg:-translate-y-1/2"
                onClick={() => setPage(currentPage + 1)}
              >
                <Image src="/assets/ui/arrow-right.png" width={24} height={30} alt="" />
              </button>
            </nav>
          )}
        </ShopContainer>
        <footer className="relative mx-4 mt-8 mb-10 flex flex-col items-center gap-5">
          <Button size="exit" variant="secondary" onClick={() => router.push('/')}>
            ← 상점 나가기
          </Button>
        </footer>
      </ShopViewport>
      <ShopTransactionModal
        transaction={dialog}
        error={error}
        onClose={() => {
          setDialog(null);
          setError('');
        }}
        onConfirm={confirm}
      />
    </>
  );
}
