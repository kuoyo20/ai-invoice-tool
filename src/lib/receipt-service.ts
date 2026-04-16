import { supabase } from "@/integrations/supabase/client";
import { generateFewShotExamples } from "./category-learning";

export interface Expense {
  id: string;
  date: string;
  type: string;
  store: string;
  amount: number;
  category: string;
  notes: string;
  tax_id: string;
  company_name: string;
  receipt_url?: string;
  amount_verified?: boolean;
}

// ─── AI 辨識 ────────────────────────────────────────

export async function processReceiptImage(
  base64Data: string,
  mimeType: string
): Promise<Expense[]> {
  const categoryHints = generateFewShotExamples();

  const { data, error } = await supabase.functions.invoke("process-receipt", {
    body: { imageBase64: base64Data, mimeType, categoryHints },
  });

  if (error) throw new Error(error.message || "處理圖片時發生錯誤");
  if (data?.error) throw new Error(data.error);

  return (data?.data || []).map((item: Omit<Expense, "id">) => ({
    ...item,
    id: crypto.randomUUID(),
    tax_id: item.tax_id || "",
    company_name: item.company_name || "",
  }));
}

// ─── 收據圖片存儲 ────────────────────────────────────

export async function uploadReceiptImage(
  file: File,
  userId: string
): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("receipts")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Upload receipt image failed:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error("Upload receipt image error:", err);
    return null;
  }
}

// ─── 重複偵測 ────────────────────────────────────────

export interface DuplicateMatch {
  existing: Expense;
  incoming: Expense;
}

export function detectDuplicates(
  incoming: Expense[],
  existing: Expense[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  for (const inc of incoming) {
    const dup = existing.find(
      (ex) =>
        ex.date === inc.date &&
        ex.store.trim().toLowerCase() === inc.store.trim().toLowerCase() &&
        Math.abs(Number(ex.amount) - Number(inc.amount)) < 1
    );
    if (dup) matches.push({ existing: dup, incoming: inc });
  }
  return matches;
}

// ─── 金額交叉驗證 ─────────────────────────────────────

export function verifyAmount(expense: Expense): boolean {
  if (!expense.notes) return true;
  const pricePattern = /(?:NT?\$|＄)?(\d+(?:,\d{3})*)(?:元)?/g;
  const prices: number[] = [];
  let match;
  while ((match = pricePattern.exec(expense.notes)) !== null) {
    const val = Number(match[1].replace(/,/g, ""));
    if (val > 0 && val < Number(expense.amount)) prices.push(val);
  }
  if (prices.length < 2) return true;
  const sum = prices.reduce((a, b) => a + b, 0);
  return Math.abs(sum - Number(expense.amount)) <= Number(expense.amount) * 0.1;
}

// ─── CRUD ────────────────────────────────────────────

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    store: row.store,
    amount: row.amount,
    category: row.category,
    notes: row.notes || "",
    tax_id: (row as any).tax_id || "",
    company_name: (row as any).company_name || "",
    receipt_url: (row as any).receipt_url || undefined,
  }));
}

export async function saveExpenses(expenses: Expense[], userId: string): Promise<void> {
  const rows = expenses.map((e) => ({
    id: e.id,
    user_id: userId,
    date: e.date,
    type: e.type,
    store: e.store,
    amount: e.amount,
    category: e.category,
    notes: e.notes,
    tax_id: e.tax_id || "",
    company_name: e.company_name || "",
    receipt_url: e.receipt_url || null,
  }));
  const { error } = await supabase.from("expenses").insert(rows);
  if (error) throw error;
}

export async function updateExpense(expense: Expense): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .update({
      date: expense.date,
      type: expense.type,
      store: expense.store,
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes,
      tax_id: expense.tax_id || "",
      company_name: expense.company_name || "",
      receipt_url: expense.receipt_url || null,
    })
    .eq("id", expense.id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

// ─── CSV 匯出 ────────────────────────────────────────

export function exportToCSV(expenses: Expense[]) {
  if (expenses.length === 0) return;
  const headers = ["日期", "憑證類型", "消費店家", "金額 (NTD)", "報帳類別", "備註品項", "統一編號", "公司名稱"];
  const csvContent = [
    headers.join(","),
    ...expenses.map((exp) =>
      [exp.date, exp.type, `"${exp.store}"`, exp.amount, exp.category, `"${exp.notes}"`, exp.tax_id, `"${exp.company_name}"`].join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", `報帳明細_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
