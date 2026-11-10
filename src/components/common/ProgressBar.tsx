interface ProgressBarProps {
  value: number;
  labelledBy: string;
  indeterminate?: boolean;
}

export default function ProgressBar({
  value,
  labelledBy,
  indeterminate = false,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div
      role="progressbar"
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clamped}
      className="h-[31px] w-[406px] max-w-[80vw] rounded-full border-3 border-b-8 border-brown-dark bg-ivory-light p-0.5"
    >
      <div
        className="h-full rounded-full bg-yellow transition-[width] duration-150 ease-linear"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
