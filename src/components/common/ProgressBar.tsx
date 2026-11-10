interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className="h-[31px] w-[406px] max-w-[80vw] rounded-full border-3 border-b-8 border-brown-dark bg-white p-0.5"
    >
      <div
        className="h-full rounded-full bg-yellow transition-[width] duration-150 ease-linear"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
