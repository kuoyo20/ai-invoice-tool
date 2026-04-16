import React, { useMemo } from "react";
import { DollarSign, Receipt, TrendingUp, Tag } from "lucide-react";
import type { Expense } from "@/lib/receipt-service";

interface SummaryStatsProps {
  expenses: Expense[];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ expenses }) => {
  const stats = useMemo(() => {
    if (expenses.length === 0) return null;

    const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const avg = total / expenses.length;

    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + (Number(e.amount) || 0);
    });
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];

    return { total, count: expenses.length, avg, topCategory };
  }, [expenses]);

  if (!stats) return null;

  const cards = [
    {
      icon: DollarSign,
      label: "總金額",
      value: `$${stats.total.toLocaleString()}`,
      color: "text-primary bg-primary/10",
    },
    {
      icon: Receipt,
      label: "總筆數",
      value: `${stats.count} 筆`,
      color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      icon: TrendingUp,
      label: "平均金額",
      value: `$${Math.round(stats.avg).toLocaleString()}`,
      color: "text-orange-600 bg-orange-500/10 dark:text-orange-400",
    },
    {
      icon: Tag,
      label: "最大分類",
      value: stats.topCategory ? stats.topCategory[0] : "—",
      sub: stats.topCategory ? `$${stats.topCategory[1].toLocaleString()}` : undefined,
      color: "text-purple-600 bg-purple-500/10 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border border-border p-4 flex items-start gap-3"
        >
          <div className={`p-2 rounded-lg ${card.color}`}>
            <card.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="font-bold text-foreground text-sm truncate">{card.value}</p>
            {card.sub && (
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;
