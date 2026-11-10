'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useStore } from 'zustand';
import { CHAT_MAX_LENGTH } from '@/constants/plaza';
import useStomp from '@/hooks/useStomp';
import { plazaStore } from '@/stores/plazaStore';
import { STOMP_DEST, type ChatPayload } from '@/types/socket';

const NICKNAME_COLORS = ['text-badge-hat', 'text-coral', 'text-badge-face', 'text-yellow'];

export default function PlazaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const messages = useStore(plazaStore, (state) => state.messages);
  const { publish } = useStomp();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    const payload: ChatPayload = { text };
    if (publish(STOMP_DEST.PLAZA_CHAT, payload)) setText('');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 left-[50px] z-20 flex items-end gap-2 rounded-[20px] bg-black/70 px-5 py-2.5 font-jua text-2xl text-white max-md:left-4"
        aria-expanded={false}
      >
        채팅
        <Image src="/assets/ui/keyboard-arrow-up.svg" alt="" width={36} height={36} />
      </button>
    );
  }

  return (
    <section
      aria-label="광장 채팅"
      className="fixed bottom-10 left-[50px] z-20 flex w-[600px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-[20px] bg-black/70 p-5 font-jua text-xl max-md:left-4"
    >
      <div className="flex items-start gap-4">
        <ul
          ref={listRef}
          className="flex max-h-[148px] min-w-0 flex-1 flex-col gap-4 overflow-y-auto"
          aria-live="polite"
        >
          {messages.map((message) => (
            <li key={`${message.memberId}-${message.ts}`} className="flex gap-3">
              <span
                className={`shrink-0 ${NICKNAME_COLORS[message.memberId % NICKNAME_COLORS.length]}`}
              >
                {message.nickname}
              </span>
              <span className="min-w-0 break-words text-white">{message.text}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setIsOpen(false)} aria-label="채팅 닫기">
          <Image
            src="/assets/ui/keyboard-arrow-up.svg"
            alt=""
            width={36}
            height={36}
            className="rotate-180"
          />
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex h-[57px] items-center gap-2.5 rounded-xl bg-white px-5 py-3"
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') event.currentTarget.blur();
          }}
          maxLength={CHAT_MAX_LENGTH}
          placeholder="메세지를 입력하세요"
          aria-label="채팅 메세지"
          className="min-w-0 flex-1 text-brown-dark outline-none placeholder:text-brown-muted"
        />
        <button type="submit" className="shrink-0 rounded-[20px] bg-coral px-3 py-1 text-white">
          보내기
        </button>
      </form>
    </section>
  );
}
