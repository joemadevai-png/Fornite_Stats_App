interface FunFactProps {
  emoji: string;
  text: string;
}

export default function FunFact({ emoji, text }: FunFactProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
      <span className="shrink-0 text-xl">{emoji}</span>
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
    </div>
  );
}
