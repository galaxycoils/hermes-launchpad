export default function Sparkline({ data, positive, w = 120, h = 36 }: { data: number[]; positive: boolean; w?: number; h?: number }) {
  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0" aria-label={positive ? 'Positive price movement' : 'Negative price movement'} role="img">
      <polyline className="sparkline-path" points={pts} fill="none" stroke={positive ? '#00ff66' : '#ff3b30'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
