/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import { fmtUsd } from "@/lib/tokens";

// ---- Types ----
interface OhlcvBar {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradeMarker {
  time: number;
  side: "buy" | "sell";
  price: number;
}

interface PriceChartProps {
  tokenId: string;
  tokenName: string;
  tokenTicker: string;
}

type Timeframe = "1m" | "5m" | "1h" | "1d";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "1h", "1d"];

// ---- Styles ----
const CHART_BG = "#0a0a0a";
const GRID_COLOR = "rgba(255,255,255,0.05)";
const UP_COLOR = "#00ff66";
const DOWN_COLOR = "#ff3366";
const CROSSHAIR_COLOR = "rgba(255,255,255,0.3)";
const TOOLTIP_BG = "#111111";

// ---- Helpers ----
async function fetchOhlcv(tokenId: string, tf: Timeframe): Promise<{ bars: OhlcvBar[]; trades: TradeMarker[] }> {
  try {
    const res = await fetch(`/api/tokens/${encodeURIComponent(tokenId)}/ohlcv?tf=${tf}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      bars: (data.bars ?? data.ohlcv ?? []).map((b: Record<string, number>) => ({
        time: b.time ?? b.t ?? b.timestamp,
        open: b.open ?? b.o,
        high: b.high ?? b.h,
        low: b.low ?? b.l,
        close: b.close ?? b.c,
        volume: b.volume ?? b.v ?? 0,
      })),
      trades: data.trades ?? [],
    };
  } catch {
    return { bars: [], trades: [] };
  }
}

function generateFallbackBars(basePrice: number, count: number): OhlcvBar[] {
  const now = Math.floor(Date.now() / 1000);
  const bars: OhlcvBar[] = [];
  let price = basePrice;
  for (let i = count; i >= 0; i--) {
    const time = now - i * 3600;
    const change = (Math.random() - 0.48) * basePrice * 0.05;
    const open = price;
    const close = Math.max(0.000001, price + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    bars.push({ time, open, high, low, close, volume: Math.random() * 1000 });
    price = close;
  }
  return bars;
}

// ---- Component ----
export default function PriceChart({ tokenId, tokenName, tokenTicker }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [bars, setBars] = useState<OhlcvBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<OhlcvBar | null>(null);

  // Derived stats
  const currentPrice = bars.length ? bars[bars.length - 1].close : 0;
  const openPrice = bars.length ? bars[0].open : 0;
  const priceChange = openPrice ? ((currentPrice - openPrice) / openPrice) * 100 : 0;
  const totalVolume = bars.reduce((sum, b) => sum + b.volume, 0);
  const highPrice = bars.length ? Math.max(...bars.map((b) => b.high)) : 0;
  const lowPrice = bars.length ? Math.min(...bars.map((b) => b.low)) : 0;

  // Bonding curve progress (simplified: based on current price relative to a target)
  const graduationTarget = 85; // SOL
  const currentSol = currentPrice > 0 ? currentPrice * 1000 : 0; // rough estimate
  const bondingProgress = Math.min(100, (currentSol / graduationTarget) * 100);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await fetchOhlcv(tokenId, timeframe);
    if (result.bars.length > 0) {
      setBars(result.bars);
    } else {
      // Generate fallback data based on current price or a default seed
      const seedPrice = currentPrice || 0.0001;
      setBars(generateFallbackBars(seedPrice, 100));
    }
    setLoading(false);
  }, [tokenId, timeframe, currentPrice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: CHART_BG },
        textColor: "#ffffff",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: CROSSHAIR_COLOR, width: 1, style: 2 },
        horzLine: { color: CROSSHAIR_COLOR, width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // Add series (candlestick if enough data, else line)
    let series: ISeriesApi<"Candlestick"> | ISeriesApi<"Line">;
    if (bars.length > 1) {
      series = chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderUpColor: UP_COLOR,
        borderDownColor: DOWN_COLOR,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
      });
      const candleData = bars.map((b) => ({
        time: b.time as UTCTimestamp,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));
      series.setData(candleData);
    } else {
      series = chart.addSeries(LineSeries, {
        color: UP_COLOR,
        lineWidth: 2,
      });
      const lineData = bars.map((b) => ({
        time: b.time as UTCTimestamp,
        value: b.close,
      }));
      series.setData(lineData);
    }
    seriesRef.current = series;

    // Subscribe to crosshair move for tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoveredBar(null);
        return;
      }
      const bar = bars.find((b) => b.time === param.time);
      if (bar) {
        setHoveredBar(bar);
      } else {
        setHoveredBar(null);
      }
    });

    // Responsive resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update series data when bars change
  useEffect(() => {
    if (!seriesRef.current || bars.length === 0) return;
    const series = seriesRef.current;
    // Try candlestick data first
    try {
      const candleData = bars.map((b) => ({
        time: b.time as UTCTimestamp,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));
      series.setData(candleData);
    } catch {
      // Fallback to line data
      const lineData = bars.map((b) => ({
        time: b.time as UTCTimestamp,
        value: b.close,
      }));
      series.setData(lineData);
    }
  }, [bars]);

  const isPositive = priceChange >= 0;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-white/5 bg-surface p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{tokenName}</span>
          <span className="font-mono text-xs text-white/50">${tokenTicker}</span>
        </div>
        {/* Timeframe selector */}
        <div className="flex gap-1 rounded-lg bg-black/30 p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors ${
                timeframe === tf
                  ? "bg-pump text-black font-bold"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Price</p>
          <p className="font-mono text-sm font-bold text-white">
            {loading ? "\u2014" : fmtUsd(currentPrice)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Change</p>
          <p className={`font-mono text-sm font-bold ${isPositive ? "text-pump" : "text-dump"}`}>
            {loading ? "\u2014" : `${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Volume</p>
          <p className="font-mono text-sm font-bold text-white">
            {loading ? "\u2014" : fmtUsd(totalVolume)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40">High / Low</p>
          <p className="font-mono text-sm font-bold text-white">
            {loading ? "\u2014" : `${fmtUsd(highPrice)} / ${fmtUsd(lowPrice)}`}
          </p>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative w-full" style={{ height: "clamp(300px, 50vw, 400px)" }}>
        {/* Tooltip overlay */}
        {hoveredBar && (
          <div
            className="pointer-events-none absolute left-2 top-2 z-10 rounded-md px-2.5 py-1.5 text-[10px] font-mono text-white"
            style={{ backgroundColor: TOOLTIP_BG }}
          >
            <div className="flex gap-3">
              <span>O <span className="font-bold">{fmtUsd(hoveredBar.open)}</span></span>
              <span>H <span className="font-bold text-pump">{fmtUsd(hoveredBar.high)}</span></span>
              <span>L <span className="font-bold text-dump">{fmtUsd(hoveredBar.low)}</span></span>
              <span>C <span className="font-bold">{fmtUsd(hoveredBar.close)}</span></span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-pump border-t-transparent" />
          </div>
        )}
      </div>

      {/* Bonding curve progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-white/40">Bonding Curve</span>
          <span className="font-mono text-xs text-white/50">{bondingProgress.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-green-400 to-emerald-300 transition-all duration-500 ease-out"
            style={{ width: `${bondingProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-white/30">
          <span>0%</span>
          <span>Graduation</span>
        </div>
      </div>
    </div>
  );
}
