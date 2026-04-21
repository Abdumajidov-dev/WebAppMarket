"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  value: number;
  max: number;
  onChange: (val: number) => void;
}

export function QuantitySelector({ value, max, onChange }: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Kamaytirish"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center text-lg font-semibold">{value}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Ko'paytirish"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
