"use client";

import { useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { ForecastResponse } from "@/types/database";

// Dummy historical monthly revenue data (24 months)
const DUMMY_HISTORICAL_DATA = [
  12400, 15200, 13800, 16500, 18200, 17600, 19800, 22100, 21400, 24300, 23800,
  26500, 25900, 28100, 27600, 30200, 29800, 32500, 31900, 34100, 33600, 36200,
  35800, 38500,
];

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getMonthLabel(index: number, startYear: number = 2025): string {
  const month = index % 12;
  const year = startYear + Math.floor(index / 12);
  return `${MONTH_LABELS[month]} ${year}`;
}

export function ForecastChart() {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartData = buildChartData(forecastData);

  async function handleForecast() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: DUMMY_HISTORICAL_DATA,
          periods: 6,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data: ForecastResponse = await res.json();
      setForecastData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forecast failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300">
              TensorFlow Engine
            </span>
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Revenue Predictive Curve
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Machine learning neural network forecasting forward 6-month trajectory
          </p>
        </div>
        <Button onClick={handleForecast} isLoading={isLoading} size="md">
          {forecastData ? "Re-run AI Model" : "Generate Forecast"}
        </Button>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Main Chart Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 transition-all duration-200">
        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="text-center">
              <Spinner className="mx-auto h-8 w-8 text-indigo-600" />
              <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Computing weights across historical revenue vectors...
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-zinc-200/70 dark:text-zinc-800/70"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#71717a" }}
                stroke="#d4d4d8"
                interval={2}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                stroke="#d4d4d8"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "14px",
                  color: "#f8fafc",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  fontSize: "12px",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any) => [
                  `$${Number(value ?? 0).toLocaleString()}`,
                ]) as never}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="historical"
                fill="url(#historicalGrad)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="historical"
                name="Historical Revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#6366f1" }}
                activeDot={{ r: 5, fill: "#4f46e5" }}
                connectNulls={false}
              />
              {forecastData && (
                <>
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    fill="url(#forecastGrad)"
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="AI Forecast Projection"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    dot={{ r: 3.5, fill: "#10b981" }}
                    activeDot={{ r: 6, fill: "#059669" }}
                    connectNulls={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Projection Metric Cards */}
      {forecastData && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Forecast Horizon
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {forecastData.periods} Months
            </p>
            <p className="mt-1 text-xs text-zinc-400">Iterative auto-regression</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5 shadow-xs backdrop-blur-md dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Projected Next Month
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              ${forecastData.forecast[0]?.toLocaleString() ?? "—"}
            </p>
            <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">+3.4% estimated velocity</p>
          </div>
          <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-5 shadow-xs backdrop-blur-md dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Cumulative 6mo Forecast
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              $
              {forecastData.forecast
                .reduce((a, b) => a + b, 0)
                .toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-indigo-600/80 dark:text-indigo-400/80">Total predicted revenue</p>
          </div>
        </div>
      )}
    </div>
  );
}

function buildChartData(forecast: ForecastResponse | null) {
  const data: Array<{
    label: string;
    historical: number | null;
    forecast: number | null;
  }> = [];

  // Historical data points
  DUMMY_HISTORICAL_DATA.forEach((val, i) => {
    data.push({
      label: getMonthLabel(i),
      historical: val,
      forecast: null,
    });
  });

  if (forecast) {
    // Connect forecast to last historical point
    const lastIdx = data.length - 1;
    data[lastIdx].forecast = data[lastIdx].historical;

    // Forecast data points
    forecast.forecast.forEach((val, i) => {
      data.push({
        label: getMonthLabel(DUMMY_HISTORICAL_DATA.length + i),
        historical: null,
        forecast: Math.round(val),
      });
    });
  }

  return data;
}
