import { cn, riskColor, riskLabel } from '@/lib/utils';

export function RiskBadge({ level }: { level: string }) {
  return (
    <span className={cn('badge', riskColor(level))}>
      {riskLabel(level)}
    </span>
  );
}
