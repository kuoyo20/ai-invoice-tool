import React, { useState } from "react";
import { FileSpreadsheet, Loader2, Mail, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Mode = "signin" | "signup";

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !password) {
      setError("請輸入 Email 和密碼");
      return;
    }
    if (password.length < 6) {
      setError("密碼至少 6 個字元");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setInfo("註冊成功！請到信箱收驗證信並點連結啟用帳號。");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "登入失敗";
      if (msg.includes("Invalid login credentials")) {
        setError("Email 或密碼錯誤");
      } else if (msg.includes("User already registered")) {
        setError("此 Email 已註冊，請改用「登入」");
      } else if (msg.includes("Email not confirmed")) {
        setError("請先到信箱點驗證連結");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 左側：品牌訴求 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/95 via-primary to-indigo-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg">AI 發票報帳神器</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            拍照上傳，<br />
            <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              AI 自動建檔
            </span>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            告別手動 Key 發票的痛苦，把報帳時間從半天壓到 5 分鐘。
          </p>
          <div className="space-y-2.5 pt-4">
            {[
              "支援電子發票、傳統發票、收據、PDF",
              "自動辨識金額、店家、統編、品項",
              "重複偵測、分類學習、CSV 匯出",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5 text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          Powered by Google Gemini · Built with Supabase
        </div>
      </div>

      {/* 右側：登入表單 */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* 手機版顯示 logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-foreground">AI 發票報帳神器</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {mode === "signin" ? "歡迎回來" : "建立你的帳號"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "登入後即可開始上傳發票辨識" : "註冊只要 30 秒，立刻開始用"}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-9 h-11"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === "signup" ? "至少 6 個字元" : "輸入密碼"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-9 h-11"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                {info}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 font-semibold shadow-soft"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                mode === "signin" ? "登入" : "建立帳號"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">或</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full h-11 gap-2 font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            使用 Google 帳號繼續
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>還沒有帳號？{" "}
                <button onClick={() => { setMode("signup"); setError(null); setInfo(null); }} className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  立即註冊
                </button>
              </>
            ) : (
              <>已經有帳號了？{" "}
                <button onClick={() => { setMode("signin"); setError(null); setInfo(null); }} className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  登入
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
