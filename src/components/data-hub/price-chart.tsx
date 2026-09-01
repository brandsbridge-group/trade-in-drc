"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function PriceChart({
  data,
  unit,
  currency,
  locale,
}: {
  data: { observed_at: string; value: number }[];
  unit: string;
  currency: string;
  /** Optional BCP-47 locale for axis/tooltip date labels; defaults to runtime locale. */
  locale?: string;
}) {
  // A rolling 12-month window reads best with month + year labels rather than a
  // full day-level date, so the X axis stays legible across ~12 ticks.
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
  });
  const formatted = data.map((p) => ({
    ...p,
    label: monthFormatter.format(new Date(p.observed_at)),
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={16} />
          <YAxis
            tick={{ fontSize: 12 }}
            unit={` ${currency}/${unit}`}
            width={70}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
