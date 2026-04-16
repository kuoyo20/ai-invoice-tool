import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import {
  fetchExpenses,
  saveExpenses,
  updateExpense,
  deleteExpense,
  processReceiptImage,
  uploadReceiptImage,
  detectDuplicates,
  verifyAmount,
  type Expense,
  type DuplicateMatch,
} from "@/lib/receipt-service";
import { compressImage } from "@/lib/image-utils";
import { learnCategoryPreference } from "@/lib/category-learning";
import { useToast } from "./use-toast";
import { toast as sonnerToast } from "sonner";
import { useState, useCallback } from "react";

const QUERY_KEY = ["expenses"];

export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState({ current: 0, total: 0 });
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [pendingDuplicates, setPendingDuplicates] = useState<DuplicateMatch[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);

  // ─── Query ─────────────────────────────────────────
  const {
    data: expenses = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchExpenses,
    enabled: !!user,
    staleTime: 30_000,
  });

  // ─── Mutations ─────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (newExpenses: Expense[]) => {
      if (!user) throw new Error("Not authenticated");
      return saveExpenses(newExpenses, user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: (expense: Expense) => updateExpense(expense),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData<Expense[]>(QUERY_KEY);
      queryClient.setQueryData<Expense[]>(QUERY_KEY, (old) =>
        (old || []).map((e) => (e.id === updated.id ? updated : e))
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(QUERY_KEY, context.prev);
      toast({ title: "更新失敗", description: "請稍後再試", variant: "destructive" });
    },
    onSuccess: () => toast({ title: "更新成功", description: "已更新報帳記錄" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const prev = queryClient.getQueryData<Expense[]>(QUERY_KEY);
      queryClient.setQueryData<Expense[]>(QUERY_KEY, (old) =>
        (old || []).filter((e) => e.id !== id)
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(QUERY_KEY, context.prev);
      toast({ title: "刪除失敗", description: "請稍後再試", variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  // ─── 刪除（帶 Undo）───────────────────────────────

  const handleRemoveWithUndo = useCallback(
    (id: string) => {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) return;

      // 先樂觀移除
      queryClient.setQueryData<Expense[]>(QUERY_KEY, (old) =>
        (old || []).filter((e) => e.id !== id)
      );

      let cancelled = false;
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          deleteMutation.mutate(id);
        }
      }, 5000);

      sonnerToast(`已刪除「${expense.store}」$${expense.amount.toLocaleString()}`, {
        duration: 5000,
        action: {
          label: "復原",
          onClick: () => {
            cancelled = true;
            clearTimeout(timeoutId);
            queryClient.setQueryData<Expense[]>(QUERY_KEY, (old) =>
              [expense, ...(old || [])].sort((a, b) => b.date.localeCompare(a.date))
            );
            sonnerToast("已復原刪除");
          },
        },
      });
    },
    [expenses, deleteMutation, queryClient]
  );

  // ─── 上傳處理（含壓縮 + 存圖 + 重複偵測 + 金額驗證）──

  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      if (!user) return;
      setIsProcessing(true);
      setProcessingError(null);
      setProcessingCount({ current: 0, total: files.length });
      let totalNew = 0;
      const allNewExpenses: Expense[] = [];

      for (let i = 0; i < files.length; i++) {
        setProcessingCount({ current: i + 1, total: files.length });
        try {
          const file = files[i];

          // 1. 壓縮圖片
          const { base64, mimeType } = await compressImage(file);

          // 2. AI 辨識
          const newExpenses = await processReceiptImage(base64, mimeType);

          // 3. 上傳原始圖片到 Storage
          const receiptUrl = await uploadReceiptImage(file, user.id);
          if (receiptUrl) {
            newExpenses.forEach((e) => (e.receipt_url = receiptUrl));
          }

          // 4. 金額交叉驗證
          newExpenses.forEach((e) => {
            e.amount_verified = verifyAmount(e);
          });

          allNewExpenses.push(...newExpenses);
          totalNew += newExpenses.length;
        } catch (err) {
          console.error(`Error processing file ${files[i].name}:`, err);
          setProcessingError(
            err instanceof Error ? err.message : `處理 ${files[i].name} 時發生錯誤`
          );
        }
      }

      setIsProcessing(false);

      if (allNewExpenses.length === 0) return;

      // 5. 重複偵測
      const duplicates = detectDuplicates(allNewExpenses, expenses);
      if (duplicates.length > 0) {
        // 有可能重複的，讓 UI 決定要不要存
        setPendingDuplicates(duplicates);
        setPendingExpenses(allNewExpenses);
        return;
      }

      // 沒有重複，直接存
      await saveMutation.mutateAsync(allNewExpenses);
      toast({
        title: "辨識完成",
        description: `共新增了 ${totalNew} 筆報帳記錄（${files.length} 個檔案）`,
      });
    },
    [user, expenses, saveMutation, toast]
  );

  // ─── 確認儲存（含重複）────────────────────────────

  const confirmSavePending = useCallback(
    async (skipDuplicateIds?: Set<string>) => {
      const toSave = skipDuplicateIds
        ? pendingExpenses.filter((e) => !skipDuplicateIds.has(e.id))
        : pendingExpenses;

      if (toSave.length > 0) {
        await saveMutation.mutateAsync(toSave);
        toast({
          title: "辨識完成",
          description: `共新增了 ${toSave.length} 筆報帳記錄`,
        });
      }
      setPendingDuplicates([]);
      setPendingExpenses([]);
    },
    [pendingExpenses, saveMutation, toast]
  );

  const cancelPending = useCallback(() => {
    setPendingDuplicates([]);
    setPendingExpenses([]);
  }, []);

  // ─── 手動新增 ──────────────────────────────────────

  const handleAddManual = useCallback(
    async (expense: Expense) => {
      try {
        await saveMutation.mutateAsync([expense]);
        toast({ title: "新增成功", description: "已手動新增一筆報帳記錄" });
      } catch {
        toast({ title: "新增失敗", description: "請稍後再試", variant: "destructive" });
      }
    },
    [saveMutation, toast]
  );

  // ─── 編輯（含分類學習）──────────────────────────────

  const handleSaveEdit = useCallback(
    async (original: Expense, updated: Expense) => {
      // 如果使用者改了分類，記錄學習
      if (original.category !== updated.category) {
        learnCategoryPreference(updated.store, updated.category);
      }
      updateMutation.mutate(updated);
    },
    [updateMutation]
  );

  return {
    expenses,
    isLoading,
    fetchError,
    isProcessing,
    processingCount,
    processingError,
    pendingDuplicates,
    pendingExpenses,
    handleFilesSelect,
    handleRemoveWithUndo,
    handleAddManual,
    handleSaveEdit,
    confirmSavePending,
    cancelPending,
  };
}
