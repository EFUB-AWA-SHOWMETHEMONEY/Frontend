import Image from 'next/image';
import { dailyQuiz } from '@/constants/quiz';
import { formatCountdown } from '@/stores/quizStore';
import styles from './quiz.module.css';

export default function QuizStatusCard({
  completed,
  correct,
  remainingSeconds,
}: {
  completed: boolean;
  correct: boolean;
  remainingSeconds: number;
}) {
  return completed ? (
    <section
      className={`${styles.statusCard} ${styles.countdownCard}`}
      aria-label="다음 퀴즈까지 남은 시간"
    >
      <h2 className={styles.cardTitle}>남은 시간</h2>
      <p className={styles.countdown} role="timer" aria-live="off">
        {formatCountdown(remainingSeconds)}
      </p>
    </section>
  ) : (
    <section
      className={`${styles.statusCard} ${styles.rewardCard}`}
      data-correct={correct}
      aria-label={correct ? '정답 보상' : '참여 보상'}
    >
      <h2 className={styles.cardTitle}>{correct ? '정답 보상' : '참여 보상'}</h2>
      <p className={styles.rewardAmount}>
        <Image src="/assets/ui/coin.svg" alt="" width={54} height={54} />+
        {correct ? dailyQuiz.correctReward : dailyQuiz.incorrectReward}
      </p>
      <p className={styles.rewardHint}>보유 화폐에 보상이 지급되었습니다.</p>
    </section>
  );
}
