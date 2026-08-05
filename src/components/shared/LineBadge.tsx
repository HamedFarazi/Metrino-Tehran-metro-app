/**
 * LineBadge — displays a metro line number with its color.
 */
import { cn } from "@/lib/utils";
import { LINE_COLORS, LINE_NAMES_FA } from "@/types/metro";

interface LineBadgeProps {
  lineId: number;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeStyles = {
  xs: "h-4 w-4 text-[10px]",
  sm: "h-5 w-5 text-xs",
  md: "h-6 w-6 text-xs",
  lg: "h-8 w-8 text-sm",
};

export function LineBadge({ lineId, size = "sm", showLabel = false, className }: LineBadgeProps) {
  const color = LINE_COLORS[lineId] ?? "#888";
  const label = LINE_NAMES_FA[lineId] ?? `خط ${lineId}`;

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div
          className={cn("flex items-center justify-center rounded-full font-bold text-white shrink-0", sizeStyles[size])}
          style={{ backgroundColor: color }}
        >
          {lineId}
        </div>
        <span className="text-xs text-foreground/70 whitespace-nowrap">{label}</span>
      </div>
    );
  }

  return (
    <div
      title={label}
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white shrink-0",
        sizeStyles[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {lineId}
    </div>
  );
}

/**
 * LineColorDot — just a small dot
 */
export function LineColorDot({ lineId, className }: { lineId: number; className?: string }) {
  const color = LINE_COLORS[lineId] ?? "#888";
  return (
    <div
      className={cn("h-2 w-2 rounded-full shrink-0", className)}
      style={{ backgroundColor: color }}
    />
  );
}
