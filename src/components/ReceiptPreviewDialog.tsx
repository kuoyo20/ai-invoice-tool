import React from "react";
import { X, ExternalLink, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReceiptPreviewDialogProps {
  url: string | null;
  storeName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReceiptPreviewDialog: React.FC<ReceiptPreviewDialogProps> = ({
  url,
  storeName,
  open,
  onOpenChange,
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setZoom(1);
      setRotation(0);
    }
  }, [open]);

  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{storeName ? `${storeName} — 收據原圖` : "收據原圖"}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                title="縮小"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="旋轉"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title="在新視窗開啟"
              >
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg min-h-[300px]">
          <img
            src={url}
            alt="收據原圖"
            className="max-w-full transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;
