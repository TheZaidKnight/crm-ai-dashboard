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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Revenue Forecast
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI-powered revenue prediction based on historical data
          </p>
        </div>
        <Button onClick={handleForecast} isLoading={isLoading} size="sm">
          {forecastData ? "Re-run Forecast" : "Generate Forecast"}
        </Button>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="text-center">
              <Spinner className="mx-auto h-8 w-8 text-blue-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Running TensorFlow model...
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f3f4f6",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any) => [
                  `$${Number(value ?? 0).toLocaleString()}`,
                ]) as never}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="historical"
                name="Historical Revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
              {forecastData && (
                <>
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="AI Forecast"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={{ r: 4, fill: "#10b981" }}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    fill="#10b981"
                    fillOpacity={0.08}
                    stroke="none"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {forecastData && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Forecast Periods
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {forecastData.periods} months
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Projected Next Month
            </p>
            <p className="text-2xl font-bold text-green-600">
              ${forecastData.forecast[0]?.toLocaleString() ?? "—"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Projected Total (6mo)
            </p>
            <p className="text-2xl font-bold text-green-600">
              $
              {forecastData.forecast
                .reduce((a, b) => a + b, 0)
                .toLocaleString()}
            </p>
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
