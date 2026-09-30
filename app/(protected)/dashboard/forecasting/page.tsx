import { ForecastChart } from "@/components/charts/forecast-chart";

export default function ForecastingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          AI Forecasting
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Use machine learning to predict future revenue trends from historical
          customer data.
        </p>
      </div>

      <ForecastChart />
    </div>
  );
}
