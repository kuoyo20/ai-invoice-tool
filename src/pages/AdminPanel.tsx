import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  Receipt,
  CheckCircle2,
  XCircle,
  Crown,
  User as UserIcon,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import {
  fetchAllProfiles,
  updateUserRole,
  setUserApproval,
  deleteUserProfile,
  fetchAllExpensesWithUsers,
  type AdminExpense,
} from "@/lib/admin-service";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/hooks/use-profile";
import { exportToCSV } from "@/lib/receipt-service";

type Tab = "pending" | "users" | "expenses";

const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { isAdmin, isLoading: profileLoading } = useProfile();
  const [tab, setTab] = useState<Tab>("pending");
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: fetchAllProfiles,
    enabled: isAdmin,
  });

  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["admin", "all-expenses"],
    queryFn: fetchAllExpensesWithUsers,
    enabled: isAdmin && tab === "expenses",
  });

  // ─── Mutations ──────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      setUserApproval(id, approved),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast({
        title: vars.approved ? "已核准使用者" : "已停用使用者",
      });
    },
    onError: () => toast({ title: "操作失敗", variant: "destructive" }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) =>
      updateUserRole(id, role),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast({
        title: vars.role === "admin" ? "已升為管理員" : "已降為一般使用者",
      });
    },
    onError: () => toast({ title: "操作失敗", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUserProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast({ title: "已刪除使用者" });
      setConfirmDelete(null);
    },
    onError: () => toast({ title: "刪除失敗", variant: "destructive" }),
  });

  // ─── 篩選 ─────────────────────────────────────
  const pendingUsers = useMemo(
    () => profiles.filter((p) => !p.approved),
    [profiles]
  );

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(q) ||
        (p.display_name || "").toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  // ─── 不是 admin → 拒絕 ────────────────────────
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border shadow-soft p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-foreground">無存取權限</h1>
          <p className="text-sm text-muted-foreground">您不是管理員，無法進入此頁面。</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回主畫面
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-soft">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">管理員後台</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              返回主畫面
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Users} label="總使用者" value={profiles.length} color="primary" />
          <StatCard icon={CheckCircle2} label="已核准" value={profiles.filter((p) => p.approved).length} color="emerald" />
          <StatCard
            icon={AlertCircle}
            label="待審核"
            value={pendingUsers.length}
            color={pendingUsers.length > 0 ? "amber" : "slate"}
          />
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
          <div className="border-b border-border bg-muted/30">
            <div className="flex">
              <TabButton active={tab === "pending"} onClick={() => setTab("pending")} icon={AlertCircle}>
                待審核 {pendingUsers.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1">
                    {pendingUsers.length}
                  </span>
                )}
              </TabButton>
              <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={Users}>
                所有使用者
              </TabButton>
              <TabButton active={tab === "expenses"} onClick={() => setTab("expenses")} icon={Receipt}>
                所有報帳記錄
              </TabButton>
            </div>
          </div>

          {/* ─── 待審核 ─── */}
          {tab === "pending" && (
            <div className="p-5">
              {profilesLoading ? (
                <div className="text-center text-muted-foreground py-8">載入中...</div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>目前沒有待審核的使用者</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingUsers.map((p) => (
                    <UserRow
                      key={p.id}
                      profile={p}
                      currentUserId={currentUser?.id}
                      onApprove={() => approveMutation.mutate({ id: p.id, approved: true })}
                      onRole={(role) => roleMutation.mutate({ id: p.id, role })}
                      onDelete={() => setConfirmDelete(p)}
                      pendingMode
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── 所有使用者 ─── */}
          {tab === "users" && (
            <div className="p-5">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="搜尋 email 或名稱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              {profilesLoading ? (
                <div className="text-center text-muted-foreground py-8">載入中...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">沒有符合的使用者</div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((p) => (
                    <UserRow
                      key={p.id}
                      profile={p}
                      currentUserId={currentUser?.id}
                      onApprove={() => approveMutation.mutate({ id: p.id, approved: !p.approved })}
                      onRole={(role) => roleMutation.mutate({ id: p.id, role })}
                      onDelete={() => setConfirmDelete(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── 所有報帳記錄 ─── */}
          {tab === "expenses" && (
            <AllExpensesView expenses={allExpenses} loading={expensesLoading} />
          )}
        </div>
      </div>

      {/* 刪除確認 */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              確認刪除使用者
            </DialogTitle>
            <DialogDescription className="pt-2">
              確定要刪除 <span className="font-semibold text-foreground">{confirmDelete?.email}</span> 嗎？
              <br />
              此操作會刪除該使用者的所有報帳記錄，且無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── 子元件 ───────────────────────────────────

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "primary" | "emerald" | "amber" | "slate";
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => {
  const colorClass = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    slate: "bg-slate-500/10 text-slate-500",
  }[color];

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="font-bold text-foreground text-xl tracking-tight">{value}</p>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
      active
        ? "border-primary text-primary bg-card"
        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

interface UserRowProps {
  profile: Profile;
  currentUserId?: string;
  onApprove: () => void;
  onRole: (role: "user" | "admin") => void;
  onDelete: () => void;
  pendingMode?: boolean;
}

const UserRow: React.FC<UserRowProps> = ({ profile, currentUserId, onApprove, onRole, onDelete, pendingMode }) => {
  const isMe = profile.id === currentUserId;
  const initial = (profile.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground truncate">
            {profile.display_name || profile.email}
          </span>
          {profile.role === "admin" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded ring-1 ring-violet-200">
              <Crown className="w-2.5 h-2.5" /> ADMIN
            </span>
          )}
          {!profile.approved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ring-1 ring-amber-200">
              待審核
            </span>
          )}
          {isMe && (
            <span className="text-[10px] font-medium text-muted-foreground">(你)</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {pendingMode ? (
          <>
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={onApprove}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              核准
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
              拒絕
            </Button>
          </>
        ) : (
          <>
            {!isMe && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={onApprove}
                  title={profile.approved ? "停用" : "核准"}
                >
                  {profile.approved ? (
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => onRole(profile.role === "admin" ? "user" : "admin")}
                  title={profile.role === "admin" ? "降為一般" : "升為管理員"}
                >
                  {profile.role === "admin" ? (
                    <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Crown className="w-3.5 h-3.5 text-violet-600" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={onDelete}
                  title="刪除使用者"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface AllExpensesViewProps {
  expenses: AdminExpense[];
  loading: boolean;
}

const AllExpensesView: React.FC<AllExpensesViewProps> = ({ expenses, loading }) => {
  const [userFilter, setUserFilter] = useState<string>("all");

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    expenses.forEach((e) => {
      if (e.user_email) map.set(e.user_id, e.user_email);
    });
    return Array.from(map.entries());
  }, [expenses]);

  const filtered = useMemo(() => {
    if (userFilter === "all") return expenses;
    return expenses.filter((e) => e.user_id === userFilter);
  }, [expenses, userFilter]);

  const total = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            共 <span className="font-semibold text-foreground">{filtered.length}</span> 筆，
            總金額 <span className="font-semibold text-foreground">${total.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="text-xs h-9 px-3 rounded-lg border border-input bg-background"
          >
            <option value="all">所有使用者</option>
            {userOptions.map(([id, email]) => (
              <option key={id} value={id}>{email}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => exportToCSV(filtered)}
            disabled={filtered.length === 0}
          >
            <Receipt className="w-3.5 h-3.5" />
            匯出 CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>目前沒有報帳記錄</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground border-y border-border">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">使用者</th>
                <th className="px-4 py-2.5 text-left font-medium">日期</th>
                <th className="px-4 py-2.5 text-left font-medium">店家</th>
                <th className="px-4 py-2.5 text-left font-medium">分類</th>
                <th className="px-4 py-2.5 text-right font-medium">金額</th>
                <th className="px-4 py-2.5 text-left font-medium">公司</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-xs">
                    <div className="font-medium text-foreground">{e.user_display_name || "—"}</div>
                    <div className="text-muted-foreground">{e.user_email}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground">{e.store}</div>
                    <div className="text-xs text-muted-foreground">{e.type}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{e.category}</td>
                  <td className="px-4 py-2.5 text-right font-bold whitespace-nowrap">
                    ${Number(e.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {e.company_name && <div className="font-medium">{e.company_name}</div>}
                    {e.tax_id && <div className="text-muted-foreground font-mono">{e.tax_id}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
