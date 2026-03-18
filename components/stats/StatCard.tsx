interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
