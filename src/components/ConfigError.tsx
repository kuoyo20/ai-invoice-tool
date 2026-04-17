import React from "react";
import { AlertCircle, ExternalLink } from "lucide-react";

const ConfigError: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-lg w-full space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">尚未設定 Supabase 環境變數</h2>
          <p className="text-sm text-muted-foreground mt-2">
            應用程式需要 Supabase 認證資訊才能啟動。
          </p>
        </div>

        <div className="bg-muted rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-foreground">請在 Vercel 設定以下環境變數：</p>
          <ul className="space-y-1 font-mono text-xs">
            <li><code className="text-primary">VITE_SUPABASE_URL</code></li>
            <li><code className="text-primary">VITE_SUPABASE_PUBLISHABLE_KEY</code></li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">設定步驟：</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>到 Vercel 專案 → Settings → Environment Variables</li>
            <li>加入上述兩個變數（可從 Supabase Dashboard → Settings → API 取得）</li>
            <li>到 Deployments → 重新部署最新版本</li>
          </ol>
        </div>

        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline justify-center w-full"
        >
          開啟 Vercel Dashboard
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default ConfigError;
