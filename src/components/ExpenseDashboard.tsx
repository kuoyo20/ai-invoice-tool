import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Expense } from "@/lib/receipt-service";

const CHART_COLORS = [
  "hsl(238, 55%, 55%)",
  "hsl(152, 60%, 42%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(195, 70%, 45%)",
  "hsl(55, 75%, 50%)",
];

interface ExpenseDashboardProps {
  expenses: Expense[];
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ expenses }) => {
  if (expenses.length === 0) return null;

  // Category pie data
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + (Number(e.amount) || 0);
  });
  const pieData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Monthly bar data
  const monthMap: Record<string, Record<string, number>> = {};
  const allCategories = new Set<string>();
  expenses.forEach((e) => {
    const month = e.date?.slice(0, 7) || "未知";
    if (!monthMap[month]) monthMap[month] = {};
    monthMap[month][e.category] = (monthMap[month][e.category] || 0) + (Number(e.amount) || 0);
    allCategories.add(e.category);
  });
  const barData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cats]) => ({ month, ...cats }));

  const categories = Array.from(allCategories);
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const renderCustomLabel = ({ name, percent }: { name: string; percent: number }) =>
    percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-1">分類花費比例</h3>
        <p className="text-xs text-muted-foreground mb-4">
          總計 ${total.toLocaleString()} 元
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={50}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                fontSize: "0.8rem",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-1">月份花費趨勢</h3>
        <p className="text-xs text-muted-foreground mb-4">
          依月份分類統計
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                fontSize: "0.8rem",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            {categories.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="a"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={i === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseDashboard;
