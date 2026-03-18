interface MiniBarProps {
  data: number[];
  max: number;
  color?: string;
  height?: number;
  label?: string;
}

export default function MiniBar({
  data,
  max,
  color = "#0A84FF",
  height = 48,
  label,
}: MiniBarProps) {
  const barCount = data.length;
  const containerWidth = 280;
  const gap = 2;
  const barWidth = Math.max(2, (containerWidth - gap * (barCount - 1)) / barCount);

  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
      )}
      <div
        className="flex items-end"
        style={{ height, gap, width: containerWidth }}
      >
        {data.map((value, i) => {
          const barHeight = max > 0 ? (value / max) * height : 0;
          return (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: barWidth,
                height: Math.max(1, barHeight),
                backgroundColor: color,
                opacity: value === 0 ? 0.2 : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
