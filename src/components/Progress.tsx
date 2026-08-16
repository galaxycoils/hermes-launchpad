interface ProgressProps {
  value: number;        // 0-100
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
  animate?: boolean;
  showLabel?: boolean;
  label?: string;
}

export default function Progress({ value, size = "md", gradient = true, animate = true, showLabel, label }: ProgressProps) {
  const sizes = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  const colorClass = gradient
    ? "bg-gradient-to-r from-purple-500 via-green-400 to-emerald-300"
    : "bg-pump";
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-3">
      <div className={`overflow-hidden rounded-full bg-white/10 ${sizes[size]} ${showLabel ? "flex-1" : ""}`}>
        <div
          className={[colorClass, animate ? "transition-all duration-500 ease-out" : ""].join(" ")}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-white/50 whitespace-nowrap">{label ?? `${clamped.toFixed(0)}%`}</span>
      )}
    </div>
  );
}
