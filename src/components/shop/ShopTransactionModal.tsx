'use client';

import ShopItemImage from './ShopItemImage';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import type { ShopProduct } from '@/features/shop/catalog';
import { useShopStore } from '@/features/shop/useShopStore';
import styles from './Shop.module.css';

interface Props {
  transaction: { kind: 'purchase' | 'sale'; product: ShopProduct } | null;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ShopTransactionModal({ transaction, error, onClose, onConfirm }: Props) {
  const balance = useShopStore((state) => state.balance);
  const product = transaction?.product;
  const buying = transaction?.kind === 'purchase';
  const price = product ? (buying ? product.purchasePrice : product.salePrice) : 0;
  const insufficient = buying && balance < price;
  const format = (value: number) => value.toLocaleString('ko-KR');

  return (
    <Modal
      className={`${styles.transactionModal} ${insufficient ? styles.insufficientModal : ''}`}
      isOpen={!!transaction}
      onClose={onClose}
      title={buying ? '아이템 상세 정보' : '아이템 판매 확인'}
      actions={
        <Button disabled={insufficient || !!error} onClick={onConfirm}>
          {buying ? '구매하기' : '판매하기'}
        </Button>
      }
    >
      {product && (
        <div className={styles.modalContent}>
          <div className={styles.productDetail}>
            <div className={`${styles.itemImage} ${styles.detailImage}`}>
              <ShopItemImage src={product.image} alt={product.name} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Badge variant={product.category}>
                  {product.category === 'hat' ? '모자' : '얼굴'}
                </Badge>
                <h3 className={styles.itemName}>{product.name}</h3>
              </div>
              <p className="mt-3 text-xl text-brown-muted">{product.description}</p>
            </div>
          </div>
          <dl className={styles.balanceSummary}>
            <div>
              <dt>{insufficient ? '가격' : '보유 화폐'}</dt>
              <dd>{format(insufficient ? price : balance)}</dd>
            </div>
            <div>
              <dt>{insufficient ? '보유 화폐' : buying ? '가격' : '판매 가격'}</dt>
              <dd>{format(insufficient ? balance : price)}</dd>
            </div>
            <div className={styles.total}>
              <dt>{insufficient ? '부족한 금액' : buying ? '구매 후 잔액' : '판매 후 잔액'}</dt>
              <dd className={insufficient ? 'text-red' : 'text-black'}>
                {format(
                  insufficient
                    ? Math.max(0, price - balance)
                    : buying
                      ? balance - price
                      : balance + price,
                )}
              </dd>
            </div>
          </dl>
          {(insufficient || error) && (
            <p role="alert" className={styles.error}>
              {insufficient ? '잔액이 부족해요! 오늘의 퀴즈를 풀어 돈을 모아보세요' : error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
