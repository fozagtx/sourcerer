"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, type IChartApi } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CHART_BG = "#134d3f";
const GRID = "rgba(255,255,255,0.08)";
const TEXT = "rgba(243,243,238,0.55)";
const BORDER = "rgba(255,255,255,0.14)";

export function PriceChart({ mint }: { mint: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { data } = useQuery<Candle[]>({
    queryKey: ["candles", mint],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/${mint}/candles?interval=1m`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_BG },
        textColor: TEXT,
      },
      grid: {
        vertLines: { color: GRID },
        horzLines: { color: GRID },
      },
      height: 320,
      rightPriceScale: { borderColor: BORDER },
      timeScale: { borderColor: BORDER, timeVisible: true, secondsVisible: false },
    });
    const series = chart.addCandlestickSeries({
      upColor: "#10E68D",
      downColor: "#e6392a",
      borderUpColor: "#10E68D",
      borderDownColor: "#e6392a",
      wickUpColor: "#10E68D",
      wickDownColor: "#e6392a",
    });
    chartRef.current = chart;

    const handle = () => chart.applyOptions({ width: ref.current!.clientWidth });
    handle();
    window.addEventListener("resize", handle);

    if (data && data.length) {
      series.setData(
        data.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })),
      );
    }

    return () => {
      window.removeEventListener("resize", handle);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="comic-panel p-3">
      <p className="eyebrow mb-2 px-1">PRICE</p>
      <div ref={ref} />
    </div>
  );
}
