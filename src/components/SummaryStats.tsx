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
      gradient: "from-primary/10 to-primary/5",
      iconClass: "bg-primary/15 text-primary",
    },
    {
      icon: Receipt,
      label: "總筆數",
      value: `${stats.count}`,
      sub: "筆",
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconClass: "bg-emerald-500/15 text-emerald-600",
    },
    {
      icon: TrendingUp,
      label: "平均金額",
      value: `$${Math.round(stats.avg).toLocaleString()}`,
      gradient: "from-orange-500/10 to-orange-500/5",
      iconClass: "bg-orange-500/15 text-orange-600",
    },
    {
      icon: Tag,
      label: "最大分類",
      value: stats.topCategory ? stats.topCategory[0] : "—",
      sub: stats.topCategory ? `$${stats.topCategory[1].toLocaleString()}` : undefined,
      gradient: "from-purple-500/10 to-purple-500/5",
      iconClass: "bg-purple-500/15 text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.gradient} bg-card rounded-2xl border border-border shadow-soft p-4 hover:shadow-soft-lg transition-shadow`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconClass}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-foreground text-lg leading-tight tracking-tight truncate">
              {card.value}
              {card.sub && <span className="text-xs text-muted-foreground font-normal ml-1">{card.sub}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;
