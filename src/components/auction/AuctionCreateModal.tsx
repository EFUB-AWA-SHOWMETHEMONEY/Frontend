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
} from '@/utils/auction';
import type { AuctionType, CreateAuctionInput } from '@/types/auction';
import AuctionInventoryPicker from './AuctionInventoryPicker';
import styles from './auction-create.module.css';

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
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // A modal dialog lives in the top layer. Compute its coordinates independently
  // from AuctionViewport's transformed canvas, using exactly the same scale policy.
  useLayoutEffect(() => {
    const fit = () => {
      const scale = Math.min(
        1,
        document.documentElement.clientWidth / 1920,
        window.innerHeight / 1080,
      );
      wrapper.current?.style.setProperty('--auction-scale', String(scale));
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
    <div ref={wrapper} className={styles.scope}>
      <Modal
        isOpen
        onClose={onClose}
        title="내 아이템"
        className={styles.modal}
        actions={
          <Button type="submit" form={formId} disabled={!canSubmit}>
            경매 열기
          </Button>
        }
      >
        <p className={styles.subtitle}>경매에 올릴 아이템을 선택해주세요</p>
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
          <div className={styles.priceField}>
            <label htmlFor={`${formId}-price`}>시작가</label>
            <div className={styles.priceInput}>
              <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
              <input
                id={`${formId}-price`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="예) 1,500"
                value={digits ? Number(digits).toLocaleString('ko-KR') : ''}
                aria-invalid={!!priceError || (digits !== '' && price === null)}
                aria-describedby={priceErrorId}
                onChange={(event) => {
                  const raw = event.target.value.replaceAll(',', '');
                  if (!/^\d*$/.test(raw)) {
                    setPriceError('숫자만 입력해 주세요.');
                    return;
                  }
                  if (raw && !Number.isSafeInteger(Number(raw))) {
                    setPriceError('JavaScript 안전 정수 범위를 초과할 수 없습니다.');
                    return;
                  }
                  setDigits(raw.replace(/^0+(?=\d)/, ''));
                  setPriceError('');
                  setError('');
                }}
              />
            </div>
            <p id={priceErrorId} className={styles.fieldError} role="status">
              {priceError ||
                (digits !== '' && price === null ? '0보다 큰 시작가를 입력해 주세요.' : '')}
            </p>
          </div>
          <div className={styles.timeField}>
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
            <p id={timeHintId} className={styles.fieldError} role="status">
              {options.length === 0
                ? '오늘 선택 가능한 미래 시간이 없습니다. 다음 날 다시 열어 주세요.'
                : !timeValid
                  ? '선택 시간이 지났습니다. 미래 시간을 다시 선택해 주세요.'
                  : ''}
            </p>
          </div>
          <fieldset className={styles.types}>
            <legend>경매 방식</legend>
            <div className={styles.typeOptions}>
              {(
                [
                  {
                    value: 'PUBLIC',
                    label: 'Public',
                    description: '입찰가 공개, 10초 동안 더 높은 입찰이 없으면 낙찰',
                  },
                  {
                    value: 'PRIVATE',
                    label: 'Private',
                    description: '각자 한 번 입찰, 마감 후 최고가 낙찰',
                  },
                ] as const
              ).map((option) => (
                <label key={option.value} className={styles.typeCard}>
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
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        </form>
      </Modal>
    </div>
  );
}
