import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FileSpreadsheet, AlertCircle, LogOut, Building2, CalendarIcon, AlertTriangle, Search } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadZone from "@/components/UploadZone";
import ExpenseTable from "@/components/ExpenseTable";
import ManualEntryDialog from "@/components/ManualEntryDialog";
import ExpenseDashboard from "@/components/ExpenseDashboard";
import EditExpenseDialog from "@/components/EditExpenseDialog";
import DuplicateWarningDialog from "@/components/DuplicateWarningDialog";
import SummaryStats from "@/components/SummaryStats";
import SearchDialog from "@/components/SearchDialog";
import ReceiptPreviewDialog from "@/components/ReceiptPreviewDialog";
import ThemeToggle from "@/components/ThemeToggle";
import { exportToCSV, type Expense } from "@/lib/receipt-service";
import { useExpenses } from "@/hooks/use-expenses";
import { useAuth } from "@/hooks/use-auth";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getCompanyTheme, applyCompanyTheme, resetTheme, COMPANY_THEMES } from "@/lib/company-theme";

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<string>("all");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStore, setPreviewStore] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const { signOut } = useAuth();

  const {
    expenses,
    isProcessing,
    processingCount,
    processingError,
    pendingDuplicates,
    handleFilesSelect,
    handleRemoveWithUndo,
    handleAddManual,
    handleSaveEdit,
    confirmSavePending,
    cancelPending,
  } = useExpenses();

  // ─── 公司主題切換 ─────────────────────────────────
  useEffect(() => {
    if (selectedCompany === "all" || selectedCompany === "none") {
      resetTheme();
    } else {
      const theme = getCompanyTheme(selectedCompany);
      applyCompanyTheme(theme);
    }
    return () => resetTheme();
  }, [selectedCompany]);

  // ─── 公司清單 ─────────────────────────────────────
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    expenses.forEach((e) => {
      if (e.tax_id) map.set(e.tax_id, e.company_name || e.tax_id);
    });
    COMPANY_THEMES.forEach((t) => {
      if (!map.has(t.taxId)) map.set(t.taxId, t.name);
    });
    return Array.from(map.entries()).map(([taxId, name]) => ({ taxId, name }));
  }, [expenses]);

  // ─── 篩選 ─────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (selectedCompany === "none") result = result.filter((e) => !e.tax_id);
    else if (selectedCompany !== "all") result = result.filter((e) => e.tax_id === selectedCompany);
    if (dateFrom) {
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      result = result.filter((e) => e.date >= fromStr);
    }
    if (dateTo) {
      const toStr = format(dateTo, "yyyy-MM-dd");
      result = result.filter((e) => e.date <= toStr);
    }
    return result;
  }, [expenses, selectedCompany, dateFrom, dateTo]);

  // ─── Keyboard Shortcuts ──────────────────────────────
  useKeyboardShortcuts({
    onSearch: useCallback(() => setSearchOpen(true), []),
    onNewEntry: useCallback(() => setManualOpen(true), []),
    onExport: useCallback(() => exportToCSV(filteredExpenses), [filteredExpenses]),
  });

  // ─── 金額未驗證的筆數 ──────────────────────────────
  const unverifiedCount = useMemo(
    () => filteredExpenses.filter((e) => e.amount_verified === false).length,
    [filteredExpenses]
  );

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "all") { setDateFrom(undefined); setDateTo(undefined); }
    else if (preset === "this-month") { setDateFrom(startOfMonth(now)); setDateTo(endOfMonth(now)); }
    else if (preset === "last-month") { const lm = subMonths(now, 1); setDateFrom(startOfMonth(lm)); setDateTo(endOfMonth(lm)); }
    else if (preset === "3-months") { setDateFrom(startOfMonth(subMonths(now, 2))); setDateTo(endOfMonth(now)); }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDialogOpen(true);
  };

  const onSaveEdit = (updated: Expense) => {
    if (editingExpense) handleSaveEdit(editingExpense, updated);
  };

  const handlePreviewReceipt = (url: string, storeName: string) => {
    setPreviewUrl(url);
    setPreviewStore(storeName);
    setPreviewOpen(true);
  };

  const handleBulkRemove = (ids: string[]) => {
    ids.forEach((id) => handleRemoveWithUndo(id));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-card rounded-2xl shadow-sm p-4 md:p-6 border border-border space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 md:w-7 md:h-7" />
                AI 發票報帳神器
              </h1>
              <p className="text-muted-foreground mt-1 text-xs md:text-sm hidden sm:block">
                拍照上傳發票收據，AI 自動幫你建檔分類！
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                title="搜尋 (Ctrl+K)"
                className="h-8 w-8"
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => exportToCSV(filteredExpenses)}
                disabled={filteredExpenses.length === 0}
                variant={filteredExpenses.length > 0 ? "default" : "secondary"}
                size="sm"
                className="gap-1.5 text-xs md:text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">匯出 CSV</span>
                <span className="sm:hidden">匯出</span>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={signOut} title="登出" className="h-8 w-8">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              {[
                { key: "all", label: "全部" },
                { key: "this-month", label: "本月" },
                { key: "last-month", label: "上月" },
                { key: "3-months", label: "近3月" },
              ].map((p) => (
                <Button
                  key={p.key}
                  variant={datePreset === p.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 flex-1 sm:flex-none"
                  onClick={() => handleDatePreset(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs h-8 flex-1 sm:flex-none sm:w-[110px] justify-start", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-3 h-3 mr-1 shrink-0" />
                    {dateFrom ? format(dateFrom, "yyyy/MM/dd") : "開始日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setDatePreset("custom"); }} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">~</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs h-8 flex-1 sm:flex-none sm:w-[110px] justify-start", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-3 h-3 mr-1 shrink-0" />
                    {dateTo ? format(dateTo, "yyyy/MM/dd") : "結束日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setDatePreset("custom"); }} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                  <SelectValue placeholder="篩選公司" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部公司</SelectItem>
                  <SelectItem value="none">無統編（個人）</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.taxId} value={c.taxId}>
                      {c.name} ({c.taxId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Summary Stats */}
        <SummaryStats expenses={filteredExpenses} />

        {/* 金額驗證警告 */}
        {unverifiedCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-3 rounded-xl text-sm flex items-center gap-2 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p>有 {unverifiedCount} 筆記錄的金額與品項明細不一致，建議確認。</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-4">
            <UploadZone isProcessing={isProcessing} processingCount={processingCount} onFilesSelect={handleFilesSelect} />
            <ManualEntryDialog onAdd={handleAddManual} open={manualOpen} onOpenChange={setManualOpen} />
            <Button variant="outline" className="w-full gap-2" onClick={() => setManualOpen(true)}>
              + 手動新增記錄
            </Button>

            {processingError && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm flex items-start gap-2 border border-destructive/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{processingError}</p>
              </div>
            )}

            <div className="bg-accent/50 p-5 rounded-2xl border border-primary/10">
              <h3 className="text-sm font-bold text-primary mb-2">報帳小秘訣</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>照片請盡量保持清晰、光源充足。</li>
                <li>圖片會自動壓縮，不用擔心檔案太大。</li>
                <li>重複上傳同張發票會自動提醒。</li>
                <li>修改 AI 的分類判斷後，系統會自動學習你的偏好。</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-primary/10">
                <h4 className="text-xs font-semibold text-primary mb-1.5">快捷鍵</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+K</kbd> 搜尋</div>
                  <div><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+N</kbd> 手動新增</div>
                  <div><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+E</kbd> 匯出 CSV</div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <ExpenseTable
              expenses={filteredExpenses}
              onRemove={handleRemoveWithUndo}
              onBulkRemove={handleBulkRemove}
              onEdit={handleEdit}
              onPreviewReceipt={handlePreviewReceipt}
            />
          </div>
        </div>

        <ExpenseDashboard expenses={filteredExpenses} />

        {/* Dialogs */}
        <EditExpenseDialog
          expense={editingExpense}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={onSaveEdit}
        />

        <DuplicateWarningDialog
          duplicates={pendingDuplicates}
          onConfirmAll={() => confirmSavePending()}
          onSkipDuplicates={(skipIds) => confirmSavePending(skipIds)}
          onCancel={cancelPending}
        />

        <SearchDialog
          expenses={expenses}
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelect={handleEdit}
        />

        <ReceiptPreviewDialog
          url={previewUrl}
          storeName={previewStore}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      </div>
    </div>
  );
};

export default Index;
