interface AvatarProps {
  value?: string | null;
  size?: "sm" | "md" | "lg";
  connected?: boolean;
}

function gradientFor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 55%)`;
}

export default function Avatar({ value, size = "md", connected }: AvatarProps) {
  const sizes = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };
  if (connected) {
    return (
      <div className={[`rounded-full bg-pump/20 border border-pump/40 flex items-center justify-center`, sizes[size]].join(" ")}>
        <svg className="h-3 w-3 text-pump" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
      </div>
    );
  }
  if (!value) {
    return <div className={`rounded-full bg-white/10 flex items-center justify-center ${sizes[size]}`}><span className="text-white/30 text-xs">?</span></div>;
  }
  return (
    <div
      className={[`rounded-full flex items-center justify-center font-bold text-white`, sizes[size]].join(" ")}
      style={{ background: gradientFor(value) }}
      title={value}
    >
      {value.length > 4 ? value.slice(0, 2) : value}
    </div>
  );
}
