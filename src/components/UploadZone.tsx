import React, { useRef, useState } from "react";
import { UploadCloud, Loader2, ImagePlus, Sparkles } from "lucide-react";

interface UploadZoneProps {
  isProcessing: boolean;
  processingCount?: { current: number; total: number };
  onFilesSelect: (files: File[]) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ isProcessing, processingCount, onFilesSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelect(Array.from(files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesSelect(files);
  };

  const progress = processingCount && processingCount.total > 0
    ? (processingCount.current / processingCount.total) * 100
    : 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-card rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center min-h-[260px] p-6 overflow-hidden shadow-soft
        ${isProcessing
          ? "border-primary/40 bg-gradient-to-br from-accent/60 to-accent/20"
          : isDragging
          ? "border-primary bg-accent/40 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-accent/20"
        }`}
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
        <div className="flex flex-col items-center text-primary w-full">
          <div className="relative w-16 h-16 mb-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary/30" />
            <Sparkles className="w-6 h-6 absolute inset-0 m-auto text-primary animate-pulse" />
          </div>
          <p className="font-bold text-foreground">AI 辨識中</p>
          {processingCount && processingCount.total > 1 ? (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                第 <span className="font-semibold text-primary">{processingCount.current}</span> / {processingCount.total} 張
              </p>
              <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">辨識通常需要 5-10 秒</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center text-muted-foreground pointer-events-none">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-soft-lg mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
          </div>
          <p className="font-bold text-base text-foreground">
            {isDragging ? "放開以上傳" : "點擊或拖曳上傳發票"}
          </p>
          <p className="text-xs mt-1.5 leading-relaxed">
            支援手機拍照、截圖、PDF 檔案
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs bg-muted/70 px-3 py-1.5 rounded-full text-muted-foreground">
            <ImagePlus className="w-3 h-3" />
            可一次選擇多張批次辨識
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
