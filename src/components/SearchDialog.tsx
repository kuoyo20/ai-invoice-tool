import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Expense } from "@/lib/receipt-service";

interface SearchDialogProps {
  expenses: Expense[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (expense: Expense) => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  expenses,
  open,
  onOpenChange,
  onSelect,
}) => {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return expenses
      .filter(
        (e) =>
          e.store.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.notes || "").toLowerCase().includes(q) ||
          (e.company_name || "").toLowerCase().includes(q) ||
          (e.tax_id || "").includes(q) ||
          e.date.includes(q)
      )
      .slice(0, 20);
  }, [query, expenses]);

  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="sr-only">搜尋報帳記錄</DialogTitle>
        </DialogHeader>
        <div className="flex items-center px-4 pb-2 pt-2 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋店家、分類、備註、日期..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto p-2">
          {query.trim() === "" ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              輸入關鍵字開始搜尋
            </p>
          ) : results.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              找不到「{query}」的相關記錄
            </p>
          ) : (
            <div className="space-y-1">
              {results.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => {
                    onSelect(exp);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">{exp.store}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-accent text-accent-foreground rounded">
                        {exp.category}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {exp.date}
                      {exp.notes && ` — ${exp.notes}`}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">
                    ${Number(exp.amount).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> 選取</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> 關閉</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
