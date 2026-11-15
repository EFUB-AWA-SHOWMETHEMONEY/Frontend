import styles from './quiz.module.css';

export type QuizAnswer = 'O' | 'X';

interface QuizAnswerButtonProps {
  answer: QuizAnswer;
  selected: boolean;
  disabled?: boolean;
  onSelect: (answer: QuizAnswer) => void;
}

export default function QuizAnswerButton({
  answer,
  selected,
  onSelect,
  disabled = false,
}: QuizAnswerButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={styles.answer}
      aria-pressed={selected}
      onClick={() => onSelect(answer)}
    >
      <span className={styles.symbol} data-answer={answer}>
        {answer}
      </span>
      <span className={styles.answerLabel}>{answer === 'O' ? '맞아요' : '아니에요'}</span>
    </button>
  );
}
