'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { ItemCard, SellItemCard } from '@/components/shop/ItemCard';
import ShopContainer from '@/components/shop/ShopContainer';
import ShopTransactionModal from '@/components/shop/ShopTransactionModal';
import ShopItemImage from '@/components/shop/ShopItemImage';
import ShopSuccessNotice, { type ShopNotice } from '@/components/shop/ShopSuccessNotice';
import { findProduct, shopProducts, type ShopProduct } from '@/features/shop/catalog';
import { useShopStore } from '@/features/shop/useShopStore';
import styles from '@/components/shop/Shop.module.css';

const format = (value: number) => value.toLocaleString('ko-KR');
const CARD_STEP = 340; // 300px card + 40px gap.
type Dialog = { kind: 'purchase' | 'sale'; product: ShopProduct; instanceId?: string };

export default function ShopPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'purchase' | 'sale'>('purchase');
  const listRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ previous: false, next: false, first: 1, last: 5 });
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

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () =>
      setScroll({
        previous: list.scrollLeft > 0,
        next: list.scrollLeft + list.clientWidth < list.scrollWidth - 1,
        first: Math.floor(list.scrollLeft / CARD_STEP) + 1,
        last: Math.min(
          count,
          Math.max(1, Math.floor((list.scrollLeft + list.clientWidth + 40) / CARD_STEP)),
        ),
      });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list.addEventListener('scroll', update);
    return () => {
      observer.disconnect();
      list.removeEventListener('scroll', update);
    };
  }, [tab, count]);

  function scrollItems(direction: -1 | 1) {
    const list = listRef.current;
    if (!list) return;
    const visibleCards = Math.max(1, Math.floor((list.clientWidth + 40) / CARD_STEP));
    list.scrollBy({ left: direction * visibleCards * CARD_STEP, behavior: 'instant' });
  }

  function changeTab(next: 'purchase' | 'sale') {
    setTab(next);
    listRef.current?.scrollTo({ left: 0, behavior: 'instant' });
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
      <div
        className={`${styles.stage} ${tab === 'sale' && inventory.length > 0 ? styles.saleStage : ''}`}
      >
        <ShopContainer
          aria-label="상점"
          className={tab === 'sale' && inventory.length > 0 ? styles.saleContainer : ''}
          toolbar={
            <div className={styles.toolbarContent}>
              <h1 className="mr-7 text-[40px] leading-[61px] text-black">상점</h1>
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
                className={styles.quiz}
                title="오늘의 퀴즈는 아직 연결되지 않았어요"
              >
                오늘의 퀴즈 →
              </Button>
            </div>
          }
        >
          {tab === 'purchase' ? (
            <>
              <h2 className={styles.heading}>현재 판매 중인 아이템 목록</h2>
              <div
                ref={listRef}
                className={styles.grid}
                tabIndex={0}
                role="region"
                aria-label="구매 아이템 목록"
              >
                {shopProducts.map((product) => {
                  const owned = inventory.some((entry) => entry.productId === product.id);
                  return (
                    <ItemCard key={product.id}>
                      <div className={styles.itemImage}>
                        <ShopItemImage src={product.image} />
                      </div>
                      <h3 className={styles.itemName}>{product.name}</h3>
                      <div className={styles.price}>
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
              className={styles.empty}
              action={
                <Button size="empty" onClick={() => changeTab('purchase')}>
                  구매 탭으로 이동
                </Button>
              }
            />
          ) : (
            <>
              <div>
                <h2 className={styles.heading}>현재 보유 중인 아이템 목록</h2>
                <p className="mt-2 text-[28px] leading-[35px] text-brown-muted">
                  판매할 아이템을 선택하세요
                </p>
              </div>
              <div
                ref={listRef}
                className={styles.grid}
                tabIndex={0}
                role="region"
                aria-label="판매 아이템 목록"
              >
                {inventory.map((entry) => {
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
                      <span className={styles.itemImage}>
                        <ShopItemImage src={product.image} />
                      </span>
                      <span className={styles.itemName}>{product.name}</span>
                    </SellItemCard>
                  );
                })}
              </div>
              <div className={styles.saleSummary}>
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
        </ShopContainer>
        <footer className={styles.footer}>
          <Button size="exit" variant="secondary" onClick={() => router.push('/')}>
            ← 상점 나가기
          </Button>
          {count > 0 && (scroll.previous || scroll.next) && (
            <nav className={styles.listNavigation} aria-label="상품 목록 이동">
              <Button
                size="close"
                variant="secondary"
                disabled={!scroll.previous}
                onClick={() => scrollItems(-1)}
              >
                이전
              </Button>
              <span className="sr-only" aria-live="polite">
                {scroll.first}–{scroll.last} / {count}
              </span>
              <Button
                size="close"
                variant="secondary"
                disabled={!scroll.next}
                onClick={() => scrollItems(1)}
              >
                다음
              </Button>
            </nav>
          )}
        </footer>
      </div>
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
