import { type HTMLAttributes } from "react";

type BadgeVariant = "demo" | "active" | "migration-ready" | "onchain" | "indexed" | "agents" | "pump" | "hermes" | "oracle";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  label?: string;
}

const variants: Record<BadgeVariant, string> = {
  demo: "border-yellow-400/30 bg-yellow-400/20 text-yellow-300",
  active: "border-green-400/30 bg-green-400/10 text-green-300",
  "migration-ready": "border-yellow-400/30 bg-yellow-400/20 text-yellow-300",
  onchain: "border-green-400/30 bg-green-400/10 text-green-300",
  indexed: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  agents: "border-purple-400/30 bg-purple-500/15 text-purple-200",
  pump: "border-pump/40 bg-pump/10 text-pump",
  hermes: "border-hermes/40 bg-hermes/15 text-purple-200",
  oracle: "border-oracle/40 bg-oracle/10 text-cyan-200",
};

export default function Badge({ variant, label, className, ...props }: BadgeProps) {
  return (
    <span
      className={["inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide " + variants[variant] + " " + (className ?? "")].join(" ")}
      {...props}
    >
      {label ?? variant}
    </span>
  );
}
