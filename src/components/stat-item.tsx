interface StatItemProps {
  value: string;
  label: string;
}

export function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-bold tracking-tight">{value}</span>
      <span className="mt-1 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
