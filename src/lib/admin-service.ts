import { supabase } from "@/integrations/supabase/client";
import type { Profile, UserRole } from "@/hooks/use-profile";
import type { Expense } from "./receipt-service";

/**
 * 取得所有使用者（admin only — RLS 會自動過濾）
 */
export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Profile[];
}

/**
 * 改變使用者角色
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
}

/**
 * 審核（核准 / 取消核准）使用者
 */
export async function setUserApproval(userId: string, approved: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ approved })
    .eq("id", userId);
  if (error) throw error;
}

/**
 * 刪除使用者 profile（會自動 cascade 到 auth.users，但 auth user 還會在）
 * 通常實務上是「停用」(approved=false) 而非真的刪除
 */
export async function deleteUserProfile(userId: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

/**
 * 取得所有報帳記錄（admin RLS 會自動回傳全部使用者的）
 * 加上 user_id → email 對應，方便顯示
 */
export interface AdminExpense extends Expense {
  user_id: string;
  user_email?: string;
  user_display_name?: string | null;
}

export async function fetchAllExpensesWithUsers(): Promise<AdminExpense[]> {
  // 1. 抓全部 expenses
  const { data: expenses, error: e1 } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });
  if (e1) throw e1;

  // 2. 抓全部 profiles（admin 看得到）做對應
  const { data: profiles, error: e2 } = await supabase
    .from("profiles")
    .select("id, email, display_name");
  if (e2) throw e2;

  const profileMap = new Map<string, { email: string; display_name: string | null }>();
  (profiles || []).forEach((p) => {
    profileMap.set(p.id, { email: p.email, display_name: p.display_name });
  });

  return (expenses || []).map((row: Record<string, unknown>) => {
    const userId = row.user_id as string;
    const profile = profileMap.get(userId);
    return {
      id: row.id as string,
      date: row.date as string,
      type: row.type as string,
      store: row.store as string,
      amount: row.amount as number,
      category: row.category as string,
      notes: (row.notes as string) || "",
      tax_id: (row.tax_id as string) || "",
      company_name: (row.company_name as string) || "",
      receipt_url: (row.receipt_url as string) || undefined,
      user_id: userId,
      user_email: profile?.email,
      user_display_name: profile?.display_name,
    };
  });
}
