import { ForecastChart } from "@/components/charts/forecast-chart";

export default function ForecastingPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          TensorFlow Predictive Engine
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Revenue Forecasting
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Neural network predictions modeling expected workspace revenue run rates & quarter targets.
        </p>
      </div>

      <ForecastChart />
    </div>
  );
}
