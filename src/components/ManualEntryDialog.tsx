import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface ManualEntryDialogProps {
  onAdd: (expense: Expense) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({ onAdd, open: controlledOpen, onOpenChange: controlledOnOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "",
    store: "",
    amount: "",
    category: "",
    notes: "",
    tax_id: "",
    company_name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      type: "",
      store: "",
      amount: "",
      category: "",
      notes: "",
      tax_id: "",
      company_name: "",
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.date) newErrors.date = "請輸入日期";
    if (!form.type) newErrors.type = "請選擇憑證類型";
    if (!form.store.trim()) newErrors.store = "請輸入店家名稱";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      newErrors.amount = "請輸入有效金額";
    if (!form.category) newErrors.category = "請選擇分類";
    if (form.tax_id && !/^\d{8}$/.test(form.tax_id))
      newErrors.tax_id = "統編須為 8 位數字";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAdd({
      id: crypto.randomUUID(),
      date: form.date,
      type: form.type,
      store: form.store.trim().slice(0, 200),
      amount: Number(form.amount),
      category: form.category,
      notes: form.notes.trim().slice(0, 500),
      tax_id: form.tax_id.trim(),
      company_name: form.company_name.trim(),
    });
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            手動新增記錄
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>手動新增報帳記錄</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>憑證類型</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇類型" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="store">消費店家</Label>
            <Input
              id="store"
              placeholder="例：星巴克信義門市"
              maxLength={200}
              value={form.store}
              onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
            />
            {errors.store && <p className="text-xs text-destructive">{errors.store}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tax_id">統一編號（買方）</Label>
              <Input
                id="tax_id"
                placeholder="例：12345678"
                maxLength={8}
                value={form.tax_id}
                onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
              />
              {errors.tax_id && <p className="text-xs text-destructive">{errors.tax_id}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_name">公司名稱</Label>
              <Input
                id="company_name"
                placeholder="例：台灣科技股份有限公司"
                maxLength={100}
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">金額 (NTD)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>報帳分類</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">備註品項</Label>
            <Input
              id="notes"
              placeholder="例：冰拿鐵x2, 總匯三明治x1"
              maxLength={500}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">取消</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>新增</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualEntryDialog;
