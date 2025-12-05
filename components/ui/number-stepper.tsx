"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  label?: string;
  unit?: string;
  className?: string;
  inputClassName?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  placeholder,
  label,
  unit,
  className,
  inputClassName,
  onKeyDown,
  autoFocus,
}: NumberStepperProps) {
  const numValue = parseFloat(value) || 0;

  const increment = () => {
    const newValue = numValue + step;
    if (max !== undefined && newValue > max) return;
    // Handle floating point precision issues
    onChange(Number(newValue.toFixed(2)).toString());
  };

  const decrement = () => {
    const newValue = numValue - step;
    if (newValue < min) return;
    // Handle floating point precision issues
    onChange(Number(newValue.toFixed(2)).toString());
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label className="text-xs text-muted-foreground">{label}</label>
      )}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={decrement}
          disabled={numValue <= min}
          className="press-effect h-9 w-9 shrink-0 transition-all duration-150 hover:bg-muted"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="relative flex-1 min-w-0">
          <Input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-9 text-center tabular-nums transition-all duration-200 focus:ring-2 focus:ring-primary/20",
              unit && "pr-8",
              inputClassName
            )}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
          />
          {unit && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {unit}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={increment}
          disabled={max !== undefined && numValue >= max}
          className="press-effect h-9 w-9 shrink-0 transition-all duration-150 hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
