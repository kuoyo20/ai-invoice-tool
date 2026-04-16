import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Expense } from "@/lib/receipt-service";

const CATEGORIES = ["交通費", "餐飲費", "交際費", "辦公用品", "進修訓練", "雜支"];
const TYPES = ["電子發票", "傳統發票", "計程車收據", "明細", "其他"];

interface EditExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
}

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({ expense, open, onOpenChange, onSave }) => {
  const [form, setForm] = useState<Expense | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (expense) setForm({ ...expense });
  }, [expense]);

  if (!form) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.date) newErrors.date = "請輸入日期";
    if (!form.type) newErrors.type = "請選擇憑證類型";
    if (!form.store.trim()) newErrors.store = "請輸入店家名稱";
    if (!form.amount || Number(form.amount) <= 0) newErrors.amount = "請輸入有效金額";
    if (!form.category) newErrors.category = "請選擇分類";
    if (form.tax_id && !/^\d{8}$/.test(form.tax_id)) newErrors.tax_id = "統編須為 8 位數字";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      ...form,
      store: form.store.trim().slice(0, 200),
      notes: form.notes.trim().slice(0, 500),
      tax_id: form.tax_id.trim(),
      company_name: form.company_name.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>編輯報帳記錄</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>日期</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => f ? { ...f, date: e.target.value } : f)} />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>憑證類型</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => f ? { ...f, type: v } : f)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>消費店家</Label>
            <Input maxLength={200} value={form.store} onChange={(e) => setForm((f) => f ? { ...f, store: e.target.value } : f)} />
            {errors.store && <p className="text-xs text-destructive">{errors.store}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>統一編號（買方）</Label>
              <Input maxLength={8} value={form.tax_id} onChange={(e) => setForm((f) => f ? { ...f, tax_id: e.target.value.replace(/\D/g, "").slice(0, 8) } : f)} />
              {errors.tax_id && <p className="text-xs text-destructive">{errors.tax_id}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>公司名稱</Label>
              <Input maxLength={100} value={form.company_name} onChange={(e) => setForm((f) => f ? { ...f, company_name: e.target.value } : f)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>金額 (NTD)</Label>
              <Input type="number" min="1" value={form.amount} onChange={(e) => setForm((f) => f ? { ...f, amount: Number(e.target.value) } : f)} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>報帳分類</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => f ? { ...f, category: v } : f)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>備註品項</Label>
            <Input maxLength={500} value={form.notes} onChange={(e) => setForm((f) => f ? { ...f, notes: e.target.value } : f)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">取消</Button></DialogClose>
          <Button onClick={handleSubmit}>儲存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
