import { Flower2 } from "lucide-react";

export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="logo-mark grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white shadow-[0_6px_16px_-8px_rgb(219_39_119/0.7)]">
        <Flower2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      {!compact && <span>Florescer</span>}
    </span>
  );
}
