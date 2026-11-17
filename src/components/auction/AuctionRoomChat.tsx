'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { memberStore } from '@/stores/memberStore';
import { auctionStore } from '@/stores/auctionStore';
import { AUCTION_CHAT_MAX_LENGTH, MOCK_AUCTION_MEMBER_ID } from '@/constants/auctionMock';
import { nearChatBottom, shouldSendChatKey, validAuctionChat } from '@/utils/auctionChat';
import type { MockAuctionMessage } from '@/types/auctionMock';

export default function AuctionRoomChat({
  auctionId,
  messages: suppliedMessages,
  ended,
  blocked = false,
}: {
  auctionId: string;
  messages?: readonly MockAuctionMessage[];
  ended: boolean;
  blocked?: boolean;
}) {
  const messages = useStore(
    auctionStore,
    useShallow(
      (state) =>
        suppliedMessages ?? state.messages.filter((message) => message.auctionId === auctionId),
    ),
  );
  const [expanded, setExpanded] = useState(true);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const hydrated = useStore(memberStore, (state) => state.hydrated);
  const draftRef = useRef('');
  const sending = useRef(false);
  const composing = useRef(false);
  const history = useRef<HTMLDivElement>(null);
  const followBottom = useRef(true);
  const savedTop = useRef(0);
  const disabled = ended || blocked || !hydrated;
  const lastId = messages.at(-1)?.messageId;
  useLayoutEffect(() => {
    const list = history.current;
    if (!list || !expanded) return;
    list.scrollTop = followBottom.current ? list.scrollHeight : savedTop.current;
  }, [lastId, expanded]);

  function send() {
    if (disabled || sending.current || composing.current || !validAuctionChat(draftRef.current))
      return;
    const member = memberStore.getState();
    if (!member.hydrated) return;
    sending.current = true;
    try {
      const result = auctionStore.getState().sendChat({
        auctionId,
        senderId: MOCK_AUCTION_MEMBER_ID,
        senderName: member.nickname,
        content: draftRef.current,
        requestId: crypto.randomUUID(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Clear the synchronous draft before another click/Enter can reuse a stale render.
      draftRef.current = '';
      setDraft('');
      setError('');
    } finally {
      sending.current = false;
    }
  }
  const historyId = useId();
  return (
    <section
      className="absolute bottom-10 left-[50px] w-[600px] rounded-[20px] bg-black/70 p-5 text-white"
      aria-label="경매방 채팅"
      inert={blocked}
    >
      <div className="flex h-8 items-center justify-between">
        <span className="text-lg text-white/80" role="status">
          {error || (ended ? '채팅 · 경매 종료' : `채팅 · 최대 ${AUCTION_CHAT_MAX_LENGTH}자`)}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={historyId}
          aria-label={expanded ? '채팅 접기' : '채팅 펼치기'}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={expanded ? '' : 'rotate-180'}
          >
            <path
              d="m5 9 7 7 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div id={historyId} hidden={!expanded}>
        <div
          ref={history}
          onScroll={() => {
            const list = history.current;
            if (!list || !expanded) return;
            savedTop.current = list.scrollTop;
            followBottom.current = nearChatBottom(
              list.scrollHeight,
              list.clientHeight,
              list.scrollTop,
            );
          }}
          className="h-[132px] overflow-y-auto pr-2 text-xl leading-8"
          role="log"
          aria-label="채팅 내역"
        >
          {messages.length ? (
            messages.map((message) => (
              <p key={message.messageId} className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                <span className="mr-3 text-badge-face">{message.senderName}</span>
                {message.content}
              </p>
            ))
          ) : (
            <p className="pt-5 text-white/70">아직 대화가 없어요.</p>
          )}
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="mt-0 flex h-[57px] items-center gap-3 rounded-xl bg-white px-5 focus-within:ring-2 focus-within:ring-coral focus-within:ring-inset"
      >
        <input
          disabled={disabled}
          value={draft}
          maxLength={AUCTION_CHAT_MAX_LENGTH}
          onChange={(event) => {
            draftRef.current = event.target.value;
            setDraft(event.target.value);
            setError('');
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            if (
              shouldSendChatKey(
                event.key,
                composing.current || event.nativeEvent.isComposing,
                event.nativeEvent.keyCode,
              )
            )
              send();
          }}
          aria-label="채팅 메시지"
          placeholder={ended ? '종료된 경매입니다' : '메시지를 입력하세요'}
          className="min-w-0 flex-1 border-0 bg-transparent text-xl text-brown-muted outline-none placeholder:text-brown-muted disabled:cursor-not-allowed"
        />
        <button
          disabled={disabled || !validAuctionChat(draft)}
          type="submit"
          className="h-[33px] w-[74px] shrink-0 cursor-pointer rounded-full bg-coral text-xl text-white disabled:cursor-not-allowed disabled:bg-coral/60"
        >
          보내기
        </button>
      </form>
    </section>
  );
}
