import React, { useRef } from "react";
import { UploadCloud, Loader2, Plus } from "lucide-react";

interface UploadZoneProps {
  isProcessing: boolean;
  processingCount?: { current: number; total: number };
  onFilesSelect: (files: File[]) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ isProcessing, processingCount, onFilesSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelect(Array.from(files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className={`bg-card rounded-2xl p-8 border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center min-h-[250px] relative
        ${isProcessing ? "border-primary/40 bg-accent/50" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
    >
      <input
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={isProcessing}
        ref={fileInputRef}
      />
      {isProcessing ? (
        <div className="flex flex-col items-center text-primary">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p className="font-semibold">AI 正在努力辨識中...</p>
          {processingCount && processingCount.total > 1 && (
            <p className="text-sm text-muted-foreground mt-1">
              正在處理第 {processingCount.current} / {processingCount.total} 張
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">這可能需要幾秒鐘的時間</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-muted-foreground pointer-events-none">
          <div className="w-16 h-16 bg-accent text-primary rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="font-bold text-lg text-foreground">點擊或拖曳上傳照片</p>
          <p className="text-sm mt-2">
            支援手機拍照、截圖、PDF 檔案
            <br />
            (發票、高鐵票、計程車收據、電子發票 PDF)
          </p>
          <div className="mt-6 flex items-center gap-1 text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
            <Plus className="w-3 h-3" /> 可一次選擇多張批次辨識
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
