import React, { useState, useMemo, useCallback } from "react";
import { FileSpreadsheet, Trash2, Pencil, AlertTriangle, ImageIcon, CheckSquare, Square, XSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/lib/receipt-service";

interface ExpenseTableProps {
  expenses: Expense[];
  onRemove: (id: string) => void;
  onBulkRemove?: (ids: string[]) => void;
  onEdit: (expense: Expense) => void;
  onPreviewReceipt?: (url: string, storeName: string) => void;
}

const categoryColors: Record<string, string> = {
  交通費: "bg-accent text-accent-foreground",
  餐飲費: "bg-accent text-accent-foreground",
  交際費: "bg-accent text-accent-foreground",
  辦公用品: "bg-accent text-accent-foreground",
  進修訓練: "bg-accent text-accent-foreground",
  雜支: "bg-muted text-muted-foreground",
};

const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onRemove,
  onBulkRemove,
  onEdit,
  onPreviewReceipt,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const total = useMemo(
    () => expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0),
    [expenses]
  );

  const allSelected = expenses.length > 0 && selected.size === expenses.length;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(expenses.map((e) => e.id)));
    }
  }, [allSelected, expenses]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    if (onBulkRemove) {
      onBulkRemove(Array.from(selected));
    } else {
      selected.forEach((id) => onRemove(id));
    }
    setSelected(new Set());
  };

  const selectedTotal = useMemo(
    () =>
      expenses
        .filter((e) => selected.has(e.id))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses, selected]
  );

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center gap-2">
        <h2 className="font-semibold text-foreground">已辨識的報帳明細</h2>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs text-muted-foreground">
                已選 {selected.size} 筆 (${selectedTotal.toLocaleString()})
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-3 h-3" />
                刪除所選
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setSelected(new Set())}
              >
                <XSquare className="w-3 h-3" />
                取消
              </Button>
            </div>
          )}
          <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-md">
            共 {expenses.length} 筆
          </span>
        </div>
      </div>
      <div className="p-0 overflow-x-auto flex-1 relative">
        {expenses.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground p-8">
            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20" />
            <p>目前還沒有資料</p>
            <p className="text-sm mt-1">請從左側上傳照片開始辨識</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium whitespace-nowrap">
              <tr>
                <th className="px-2 py-3 w-8">
                  <button onClick={toggleAll} className="p-1 hover:text-primary transition-colors" title="全選/取消全選">
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 sticky left-0 bg-muted/95 backdrop-blur-sm z-10 min-w-[90px]">日期</th>
                <th className="px-4 py-3">公司/統編</th>
                <th className="px-4 py-3">分類</th>
                <th className="px-4 py-3">消費店家/憑證</th>
                <th className="px-4 py-3 text-right">總金額</th>
                <th className="px-4 py-3 w-1/4">所有品項 (備註)</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((exp) => (
                <tr
                  key={exp.id}
                  className={`hover:bg-muted/30 transition-colors ${selected.has(exp.id) ? "bg-primary/5" : ""}`}
                >
                  <td className="px-2 py-3">
                    <button onClick={() => toggleOne(exp.id)} className="p-1 hover:text-primary transition-colors">
                      {selected.has(exp.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap sticky left-0 bg-card z-10">{exp.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {exp.company_name || exp.tax_id ? (
                      <div>
                        {exp.company_name && <div className="font-medium text-foreground text-xs">{exp.company_name}</div>}
                        {exp.tax_id && <div className="text-xs text-muted-foreground font-mono">{exp.tax_id}</div>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[exp.category] || "bg-muted text-muted-foreground"}`}>
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-foreground">{exp.store}</div>
                    <div className="text-xs text-muted-foreground">{exp.type}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      {exp.amount_verified === false && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="金額與品項明細不一致" />
                      )}
                      ${exp.amount?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground min-w-[200px] whitespace-normal leading-relaxed">
                    {exp.notes}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {exp.receipt_url && (
                        <button
                          onClick={() => onPreviewReceipt?.(exp.receipt_url!, exp.store)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          title="查看收據原圖"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(exp)}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        title="編輯此筆"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemove(exp.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="刪除此筆"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 font-bold text-foreground">
              <tr>
                <td className="px-2 py-3"></td>
                <td className="px-4 py-3 sticky left-0 bg-muted/95 backdrop-blur-sm z-10"></td>
                <td colSpan={3} className="px-4 py-3 text-right">總計：</td>
                <td className="px-4 py-3 text-right text-primary text-base whitespace-nowrap">${total.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExpenseTable;
