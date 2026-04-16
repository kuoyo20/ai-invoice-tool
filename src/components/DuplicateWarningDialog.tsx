import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { DuplicateMatch } from "@/lib/receipt-service";

interface DuplicateWarningDialogProps {
  duplicates: DuplicateMatch[];
  onConfirmAll: () => void;
  onSkipDuplicates: (skipIds: Set<string>) => void;
  onCancel: () => void;
}

const DuplicateWarningDialog: React.FC<DuplicateWarningDialogProps> = ({
  duplicates,
  onConfirmAll,
  onSkipDuplicates,
  onCancel,
}) => {
  const [skipped, setSkipped] = useState<Set<string>>(
    new Set(duplicates.map((d) => d.incoming.id))
  );

  if (duplicates.length === 0) return null;

  const toggleSkip = (id: string) => {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={duplicates.length > 0} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            偵測到可能重複的發票
          </DialogTitle>
          <DialogDescription>
            以下 {duplicates.length} 筆記錄與已有資料的日期、店家、金額相同，可能是重複上傳。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto space-y-3 py-2">
          {duplicates.map((dup) => (
            <div
              key={dup.incoming.id}
              className={`p-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                skipped.has(dup.incoming.id)
                  ? "bg-muted/50 border-border opacity-60"
                  : "bg-amber-50 border-amber-200"
              }`}
              onClick={() => toggleSkip(dup.incoming.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{dup.incoming.store}</span>
                  <span className="text-muted-foreground ml-2">{dup.incoming.date}</span>
                </div>
                <span className="font-bold">${Number(dup.incoming.amount).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {skipped.has(dup.incoming.id) ? "✕ 不新增（點擊切換）" : "✓ 仍然新增（點擊切換）"}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel}>
            取消全部
          </Button>
          <Button
            variant="outline"
            onClick={() => onSkipDuplicates(skipped)}
          >
            跳過勾選的重複 ({skipped.size} 筆)
          </Button>
          <Button onClick={onConfirmAll}>
            全部新增
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateWarningDialog;
