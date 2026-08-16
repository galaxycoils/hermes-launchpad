import { type HTMLAttributes } from "react";

interface StatProps extends HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  trend?: { value: number; positive?: boolean };
  mono?: boolean;
  size?: "sm" | "md";
}

export default function Stat({ value, label, trend, mono = true, size = "md", className, ...props }: StatProps) {
  const sizes = {
    sm: "text-sm",
    md: "text-lg",
  };
  const valueClass = mono ? "font-mono tracking-tight" : "font-bold";
  return (
    <div className={[`flex flex-col gap-0.5 ${size === "sm" ? "gap-0" : ""} ${className ?? ""}`.trim()].join(" ")} {...props}>
      <div className={`${sizes[size]} ${valueClass} text-white`}>{value}</div>
      <div className="text-xs text-white/45">{label}</div>
      {trend && (
        <div className={`text-xs font-mono ${trend.positive ? "text-pump" : "text-dump"}`}>
          {trend.positive ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
