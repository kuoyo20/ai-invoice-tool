import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FileSpreadsheet, AlertCircle, LogOut, Building2, CalendarIcon, AlertTriangle, Search, Sparkles, Shield } from "lucide-react";
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
import { exportToCSV, type Expense } from "@/lib/receipt-service";
import { useExpenses } from "@/hooks/use-expenses";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
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
  const { user, signOut } = useAuth();
  const { isAdmin } = useProfile();

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

  useKeyboardShortcuts({
    onSearch: useCallback(() => setSearchOpen(true), []),
    onNewEntry: useCallback(() => setManualOpen(true), []),
    onExport: useCallback(() => exportToCSV(filteredExpenses), [filteredExpenses]),
  });

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

  const userInitial = (user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen">
      {/* 頂部導覽列 */}
      <nav className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-soft">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="font-semibold text-foreground tracking-tight hidden sm:inline">AI 發票報帳神器</span>
            <span className="font-semibold text-foreground sm:hidden">報帳神器</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">搜尋</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono ml-1">⌘K</kbd>
            </Button>
            <Button
              onClick={() => exportToCSV(filteredExpenses)}
              disabled={filteredExpenses.length === 0}
              size="sm"
              className="gap-1.5 text-xs shadow-soft"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              匯出 CSV
            </Button>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50" title="管理員後台">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">管理</span>
                </Button>
              </Link>
            )}
            <div className="ml-1 flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center text-xs font-semibold shadow-soft relative" title={user?.email}>
                {userInitial}
                {isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-violet-500 rounded-full ring-2 ring-background" title="管理員" />
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} title="登出" className="h-8 w-8">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Hero / Filter Bar */}
        <header className="bg-card rounded-2xl shadow-soft p-5 md:p-6 border border-border space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                報帳明細
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {filteredExpenses.length === 0
                  ? "拍照上傳發票收據，AI 會自動幫你建檔分類"
                  : `共 ${filteredExpenses.length} 筆記錄，總金額 $${filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* 日期 preset */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
              {[
                { key: "all", label: "全部" },
                { key: "this-month", label: "本月" },
                { key: "last-month", label: "上月" },
                { key: "3-months", label: "近3月" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleDatePreset(p.key)}
                  className={cn(
                    "text-xs h-7 px-3 rounded-md font-medium transition-all flex-1 lg:flex-none",
                    datePreset === p.key
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs h-9 flex-1 lg:flex-none lg:w-[120px] justify-start", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
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
                  <Button variant="outline" size="sm" className={cn("text-xs h-9 flex-1 lg:flex-none lg:w-[120px] justify-start", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    {dateTo ? format(dateTo, "yyyy/MM/dd") : "結束日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setDatePreset("custom"); }} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2 lg:ml-auto">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full lg:w-[200px] h-9 text-xs">
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
          <div className="bg-amber-50 text-amber-900 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 border border-amber-200 shadow-soft">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <p>有 <span className="font-semibold">{unverifiedCount}</span> 筆記錄的金額與品項明細不一致，建議確認。</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-4">
            <UploadZone isProcessing={isProcessing} processingCount={processingCount} onFilesSelect={handleFilesSelect} />
            <ManualEntryDialog onAdd={handleAddManual} open={manualOpen} onOpenChange={setManualOpen} />
            <Button variant="outline" className="w-full gap-2 h-11 font-medium" onClick={() => setManualOpen(true)}>
              + 手動新增記錄
            </Button>

            {processingError && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm flex items-start gap-2 border border-destructive/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{processingError}</p>
              </div>
            )}

            <div className="bg-gradient-to-br from-accent/70 to-accent/40 p-5 rounded-2xl border border-primary/10">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                報帳小秘訣
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                {[
                  "照片請盡量清晰、光源充足",
                  "圖片自動壓縮，不用擔心檔案太大",
                  "重複上傳同張發票會自動提醒",
                  "改 AI 分類後系統會自動學習你的偏好",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-primary/10">
                <h4 className="text-xs font-semibold text-primary mb-2">⌨️ 快捷鍵</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center justify-between"><span>搜尋</span><kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">⌘K</kbd></div>
                  <div className="flex items-center justify-between"><span>手動新增</span><kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">⌘N</kbd></div>
                  <div className="flex items-center justify-between"><span>匯出 CSV</span><kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">⌘E</kbd></div>
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
