import { formatPrice } from "@/lib/format";

interface PriceTagProps {
  amount: number;
  originalAmount?: number;
  className?: string;
}

export function PriceTag({ amount, originalAmount, className }: PriceTagProps) {
  return (
    <span className={className}>
      <span className="font-bold text-primary">{formatPrice(amount)}</span>
      {originalAmount && (
        <span className="ml-2 text-sm text-muted-foreground line-through">
          {formatPrice(originalAmount)}
        </span>
      )}
    </span>
  );
}
