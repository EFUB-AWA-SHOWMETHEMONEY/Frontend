'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import ShopViewport from '@/components/shop/ShopViewport';
import QuizAnswerButton from '@/components/quiz/QuizAnswerButton';
import QuizStatusCard from '@/components/quiz/QuizStatusCard';
import { useQuizSession } from '@/hooks/useQuizSession';
import QuizSpeechBubble from '@/components/quiz/QuizSpeechBubble';
import styles from '@/components/quiz/quiz.module.css';

export default function QuizPage() {
  const router = useRouter();
  const { screen, remainingSeconds, submit, leave, storageError } = useQuizSession();

  return (
    <ShopViewport designWidth={1920} dimBackground>
      <div className={styles.screen}>
        {/* The asset already includes the panel border, padding and bottom shadow. */}
        <Image
          className={styles.shop}
          src="/assets/quiz/npc-quiz-shop.png"
          alt="선물과 모자가 진열된 상점의 NPC"
          width={1826}
          height={489}
          priority
          unoptimized
        />
        <div className={styles.quizRow}>
          <QuizSpeechBubble screen={screen} />
          {screen === 'question' ? (
            <div className={styles.answers} role="group" aria-labelledby="quiz-question">
              <QuizAnswerButton answer="O" selected={false} onSelect={submit} />
              <QuizAnswerButton answer="X" selected={false} onSelect={submit} />
            </div>
          ) : (
            <QuizStatusCard
              correct={screen === 'correct'}
              completed={screen === 'completed'}
              remainingSeconds={remainingSeconds}
            />
          )}
        </div>
        {storageError && (
          <p role="alert" className={styles.storageError}>
            {storageError}
          </p>
        )}
        <footer className={styles.footer}>
          <Button
            size="exit"
            variant="secondary"
            aria-label="← 상점으로 돌아가기"
            onClick={() => {
              leave();
              router.push('/shop');
            }}
          >
            <Image src="/assets/ui/arrow-left.svg" alt="" width={32} height={32} className="mr-2" />
            상점으로 돌아가기
          </Button>
        </footer>
      </div>
    </ShopViewport>
  );
}
