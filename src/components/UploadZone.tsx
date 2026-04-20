import React, { useRef, useState } from "react";
import { UploadCloud, Loader2, ImagePlus, Sparkles, Camera, Image as ImageIcon, FileText } from "lucide-react";

interface UploadZoneProps {
  isProcessing: boolean;
  processingCount?: { current: number; total: number };
  onFilesSelect: (files: File[]) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ isProcessing, processingCount, onFilesSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (arr.length > 0) onFilesSelect(arr);
  };

  const handleFileChange = (ref: React.RefObject<HTMLInputElement | null>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (ref.current) ref.current.value = "";
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
    handleFiles(e.dataTransfer.files);
  };

  const progress = processingCount && processingCount.total > 0
    ? (processingCount.current / processingCount.total) * 100
    : 0;

  return (
    <div className="space-y-3">
      {/* 隱藏的 inputs（各自不同來源） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileChange(fileInputRef)}
        className="hidden"
        disabled={isProcessing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange(cameraInputRef)}
        className="hidden"
        disabled={isProcessing}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileChange(galleryInputRef)}
        className="hidden"
        disabled={isProcessing}
      />

      {/* 主拖曳區（含三按鈕） */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-card rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center p-6 overflow-hidden shadow-soft
          ${isProcessing
            ? "border-primary/40 bg-gradient-to-br from-accent/60 to-accent/20"
            : isDragging
            ? "border-primary bg-accent/40 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent/20"
          }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center text-primary w-full py-6">
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
          <>
            <div className="flex flex-col items-center text-muted-foreground mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-soft-lg mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="font-bold text-base text-foreground">
                {isDragging ? "放開以上傳" : "上傳發票"}
              </p>
              <p className="text-xs mt-1 leading-relaxed">
                <span className="hidden md:inline">點擊下方按鈕、拖曳檔案、或</span>
                直接從手機拍照
              </p>
            </div>

            {/* 三大來源按鈕 — 拍照 / 相簿 / 檔案 */}
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all"
                title="開啟相機拍照"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-foreground">拍照</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessing}
                className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all"
                title="從相簿挑選"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-foreground">相簿</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all"
                title="選擇檔案（含 PDF）"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-foreground">檔案</span>
              </button>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs bg-muted/70 px-3 py-1.5 rounded-full text-muted-foreground">
              <ImagePlus className="w-3 h-3" />
              可一次多張批次辨識
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
