'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { useAuctionInventory } from '@/hooks/useAuctionInventory';
import {
  auctionDate,
  auctionTimeOptions,
  parseAuctionPrice,
  validAuctionTime,
  millisecondsUntilAuctionBoundary,
} from '@/utils/auction';
import { AUCTION_DESIGN_WIDTH, AUCTION_DESIGN_HEIGHT } from '@/constants/auction';
import { viewportScale } from '@/utils/viewport';
import type { AuctionType, CreateAuctionInput } from '@/types/auction';
import AuctionInventoryPicker from './AuctionInventoryPicker';

export default function AuctionCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: CreateAuctionInput) => string | null;
}) {
  const { items, hydrated } = useAuctionInventory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveId = selectedId ?? items[0]?.instanceId ?? '';
  const [openedAt] = useState(() => new Date());
  const [now, setNow] = useState(openedAt);
  const date = auctionDate(openedAt);
  const [time, setTime] = useState(
    () => auctionTimeOptions(auctionDate(openedAt), openedAt)[0] ?? '',
  );
  const [digits, setDigits] = useState('');
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [type, setType] = useState<AuctionType>('PUBLIC');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const formId = useId();
  const errorId = useId();
  const priceErrorId = useId();
  const timeHintId = useId();
  const options = auctionTimeOptions(date, now);
  const price = parseAuctionPrice(digits);
  const timestamp = `${date}T${time}:00+09:00`;
  const timeValid = validAuctionTime(timestamp, now);
  const selectedValid = items.some((item) => item.instanceId === effectiveId);
  const canSubmit =
    hydrated && selectedValid && price !== null && !priceError && timeValid && !submitting;

  useEffect(() => {
    let timer: number;
    const refresh = () => {
      window.clearTimeout(timer);
      const current = new Date();
      setNow(current);
      timer = window.setTimeout(refresh, millisecondsUntilAuctionBoundary(current));
    };
    timer = window.setTimeout(refresh, millisecondsUntilAuctionBoundary(new Date()));
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // A modal dialog lives in the top layer. Compute its coordinates independently
  // from AuctionViewport's transformed canvas, using exactly the same scale policy.
  useLayoutEffect(() => {
    const fit = () => {
      const scale = viewportScale(
        document.documentElement.clientWidth,
        window.innerHeight,
        AUCTION_DESIGN_WIDTH,
        AUCTION_DESIGN_HEIGHT,
      );
      wrapper.current?.style.setProperty('--modal-scale', String(scale));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitted.current) return;
    if (!canSubmit) {
      setError('보유 아이템과 시작가, 시작 시간을 확인해 주세요.');
      return;
    }
    submitted.current = true;
    setSubmitting(true);
    const failure = onCreate({
      ownedItemInstanceId: effectiveId,
      startingPrice: price!,
      startTime: timestamp,
      type,
    });
    if (failure) {
      submitted.current = false;
      setSubmitting(false);
      setNow(new Date());
      setError(failure);
    }
  }

  return (
    <div ref={wrapper} className="[--modal-scale:1]">
      <Modal
        isOpen
        size="wide"
        onClose={onClose}
        title="내 아이템"
        className="[&_button:enabled:hover]:brightness-[0.96] [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-[5px] [&_button:focus-visible]:outline-brown-dark"
        actions={
          <Button type="submit" form={formId} disabled={!canSubmit}>
            경매 열기
          </Button>
        }
      >
        <p className="absolute top-[47px] left-40 text-xl text-brown-muted">
          경매에 올릴 아이템을 선택해주세요
        </p>
        <form id={formId} onSubmit={submit} aria-describedby={error ? errorId : undefined}>
          <AuctionInventoryPicker
            items={items}
            selectedId={effectiveId}
            hydrated={hydrated}
            onSelect={(id) => {
              setSelectedId(id);
              setError('');
            }}
          />
          <div className="absolute top-[338px] left-[38.5px] w-[534px] [&>label]:mb-2.5 [&>label]:block [&>label]:text-xl [&>label]:leading-[25px] [&>label]:text-brown-muted">
            <label htmlFor={`${formId}-price`}>시작가</label>
            <div className="flex h-[58px] items-center gap-3 rounded-[15px] border-[3px] border-brown-muted px-5 focus-within:border-brown-dark [&_input]:w-full [&_input]:min-w-0 [&_input]:text-xl [&_input]:outline-none [&_input::placeholder]:text-brown-muted">
              <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
              <input
                id={`${formId}-price`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="예) 1,500"
                value={editingPrice ? digits : digits ? Number(digits).toLocaleString('ko-KR') : ''}
                onFocus={() => setEditingPrice(true)}
                onBlur={() => {
                  setEditingPrice(false);
                  setDigits((value) => value.replace(/^0+(?=\d)/, ''));
                }}
                aria-invalid={!!priceError || (digits !== '' && price === null)}
                aria-describedby={priceErrorId}
                onChange={(event) => {
                  const raw = event.target.value.replaceAll(',', '');
                  if (!/^\d*$/.test(raw)) {
                    setPriceError('');
                    return;
                  }
                  if (raw && !Number.isSafeInteger(Number(raw))) {
                    setPriceError('JavaScript 안전 정수 범위를 초과할 수 없습니다.');
                    return;
                  }
                  setDigits(raw);
                  setPriceError('');
                  setError('');
                }}
              />
            </div>
            <p id={priceErrorId} className="mt-1 text-base leading-5 text-red-dark" role="status">
              {priceError ||
                (digits !== '' && price === null ? '0보다 큰 시작가를 입력해 주세요.' : '')}
            </p>
          </div>
          <div className="absolute top-[447px] left-[38.5px] w-[534px] [&_select]:h-[55px] [&_select]:w-full [&_select]:cursor-pointer [&_select]:appearance-none [&_select]:rounded-[15px] [&_select]:border-[3px] [&_select]:border-brown-muted [&_select]:bg-white [&_select]:px-5 [&_select]:text-xl [&_select]:text-brown-dark [&_select:disabled]:cursor-not-allowed [&_select:disabled]:bg-disabled [&_select:focus-visible]:outline-3 [&_select:focus-visible]:outline-offset-[5px] [&_select:focus-visible]:outline-brown-dark [&>label]:mb-2.5 [&>label]:block [&>label]:text-xl [&>label]:leading-[25px] [&>label]:text-brown-muted">
            <label htmlFor={`${formId}-time`}>시작 시간</label>
            <select
              id={`${formId}-time`}
              value={time}
              aria-invalid={!timeValid}
              aria-describedby={timeHintId}
              disabled={options.length === 0}
              onChange={(event) => {
                setTime(event.target.value);
                setError('');
              }}
            >
              {!options.includes(time) && (
                <option value={time} disabled>
                  {time || '선택 가능한 시간 없음'}
                </option>
              )}
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p id={timeHintId} className="mt-1 text-base leading-5 text-red-dark" role="status">
              {options.length === 0
                ? '오늘 선택 가능한 미래 시간이 없습니다. 다음 날 다시 열어 주세요.'
                : !timeValid
                  ? '선택 시간이 지났습니다. 미래 시간을 다시 선택해 주세요.'
                  : ''}
            </p>
          </div>
          <fieldset className="absolute top-[338px] left-[605px] border-0 p-0 [&_legend]:mb-2.5 [&_legend]:block [&_legend]:text-xl [&_legend]:leading-[25px] [&_legend]:text-brown-muted">
            <legend>경매 방식</legend>
            <div className="flex gap-[26px]">
              {(
                [
                  {
                    value: 'PUBLIC',
                    label: 'Public',
                    description:
                      '입찰가가 모두에게 보이고, 10초 동안 더 높은 입찰이 없으면 낙찰돼요.',
                  },
                  {
                    value: 'PRIVATE',
                    label: 'Private',
                    description: '입찰가를 각자 한 번만 적고, 마감 후 가장 높은 사람이 낙찰돼요.',
                  },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className="relative flex h-[164px] w-[306px] cursor-pointer flex-col gap-2 rounded-[23px] border-[3px] border-brown-dark p-[18px] hover:brightness-[0.96] has-[:checked]:border-coral has-[:checked]:shadow-[0_5px_0_var(--color-coral)] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-[5px] has-[:focus-visible]:outline-brown-dark [&_input]:absolute [&_input]:h-px [&_input]:w-px [&_input]:opacity-0 [&_span]:text-xl [&_span]:leading-[25px] [&_span]:text-brown-muted [&_strong]:text-[32px] [&_strong]:leading-10 [&_strong]:font-normal [&_strong]:text-brown-dark"
                >
                  <input
                    type="radio"
                    name={`${formId}-type`}
                    value={option.value}
                    checked={type === option.value}
                    onChange={() => setType(option.value)}
                  />
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p
            id={errorId}
            className="absolute bottom-[25px] left-10 max-w-[1200px] text-xl text-red-dark"
            role="alert"
          >
            {error}
          </p>
        </form>
      </Modal>
    </div>
  );
}
