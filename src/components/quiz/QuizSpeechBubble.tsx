import styles from './quiz.module.css';
import { dailyQuiz } from '@/constants/quiz';
import type { QuizScreen } from '@/stores/quizStore';

export default function QuizSpeechBubble({ screen = 'question' }: { screen?: QuizScreen }) {
  const result = screen === 'correct' || screen === 'incorrect';
  const completed = screen === 'completed';
  return (
    <section className={styles.speech} aria-labelledby="quiz-question">
      <div className={`${styles.speechBody}${result ? ` ${styles.resultBody}` : ''}`}>
        {result ? (
          <>
            <h1
              id="quiz-question"
              className={styles.resultTitle}
              data-correct={screen === 'correct'}
            >
              {screen === 'correct' ? '정답이에요!' : '아쉬워요, 오답이에요.'}
            </h1>
            <p className={styles.resultQuestion}>{dailyQuiz.question}</p>
            <p className={styles.explanation}>{dailyQuiz.explanation}</p>
          </>
        ) : (
          <>
            <p className={styles.greeting}>
              {completed
                ? '오늘의 퀴즈를 다 풀었어요. 내일 다시 와요!'
                : '오늘의 퀴즈에 어서 와요! 맞히면 선물을 받을 수 있어요'}
            </p>
            <h1 id="quiz-question" className={styles.question}>
              {completed ? '다음 퀴즈를 기다려주세요.' : dailyQuiz.question}
            </h1>
            <p className={styles.hint}>
              {completed ? '매일 자정에 초기화돼요.' : '맞으면 O, 아니면 X를 선택해주세요'}
            </p>
          </>
        )}
      </div>
      <svg className={styles.tail} width="48" height="55" viewBox="0 0 48 55" aria-hidden="true">
        <path d="M 2 53 L 24 3 L 46 53" fill="white" stroke="currentColor" strokeWidth="3" />
        <path d="M 3 53 H 45" stroke="white" strokeWidth="4" />
      </svg>
    </section>
  );
}
