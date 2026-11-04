'use client';

import ShopItemImage from './ShopItemImage';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import type { ShopProduct } from '@/constants/shop';
import { useShopStore } from '@/hooks/useShopStore';

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
      className={`[&>div:first-of-type]:min-h-0 [&>div:first-of-type]:overflow-y-auto ${insufficient ? 'h-[739px]! max-h-none! w-[800px]! max-w-none! [zoom:min(1,calc((100vw-32px)/800px),calc((100dvh-32px)/739px))] overflow-visible! p-10! [&>div:first-of-type]:overflow-visible!' : ''}`}
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
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-10 max-sm:flex-col max-sm:items-start max-sm:gap-5">
            <div
              className={`flex h-[200px] w-[254px]! w-full shrink-0 items-center justify-center rounded-[10px] border-[3px] border-brown-dark bg-cream [&_img]:h-40 [&_img]:w-40 [&_img]:max-w-full [&_img]:object-contain [&_img]:[image-rendering:pixelated]`}
            >
              <ShopItemImage src={product.image} alt={product.name} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Badge variant={product.category}>
                  {product.category === 'hat' ? '모자' : '얼굴'}
                </Badge>
                <h3 className="text-[28px] leading-[35px] text-black">{product.name}</h3>
              </div>
              <p className="mt-3 text-xl text-brown-muted">{product.description}</p>
            </div>
          </div>
          <dl className="flex flex-col gap-3 rounded-[20px] bg-cream p-5 leading-7 [&_dd]:text-2xl [&_dd]:leading-7 [&_dt]:text-xl [&_dt]:text-brown-muted [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-10">
            <div>
              <dt>{insufficient ? '가격' : '보유 화폐'}</dt>
              <dd>{format(insufficient ? price : balance)}</dd>
            </div>
            <div>
              <dt>{insufficient ? '보유 화폐' : buying ? '가격' : '판매 가격'}</dt>
              <dd>{format(insufficient ? balance : price)}</dd>
            </div>
            <div className="mt-2 border-t-2 border-disabled pt-4">
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
            <p
              role="alert"
              className="rounded-[10px] border-[3px] border-red bg-red-light px-5 py-3 text-xl leading-[25px] text-red"
            >
              {insufficient ? '잔액이 부족해요! 오늘의 퀴즈를 풀어 돈을 모아보세요' : error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
