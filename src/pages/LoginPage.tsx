import React, { useState } from "react";
import { FileSpreadsheet, Loader2, Mail, Lock } from "lucide-react";
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
      // 中文化常見錯誤
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-sm w-full space-y-5">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-accent text-primary rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI 發票報帳神器</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "登入後即可開始使用" : "建立帳號，資料雲端同步"}
            </p>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="pl-9"
              autoComplete="email"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="密碼（至少 6 字元）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="pl-9"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>
          )}
          {info && (
            <p className="text-xs text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30 p-2 rounded">
              {info}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "signin" ? "登入" : "註冊")}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>還沒有帳號？{" "}
              <button onClick={() => { setMode("signup"); setError(null); setInfo(null); }} className="text-primary hover:underline font-medium">
                點此註冊
              </button>
            </>
          ) : (
            <>已有帳號？{" "}
              <button onClick={() => { setMode("signin"); setError(null); setInfo(null); }} className="text-primary hover:underline font-medium">
                點此登入
              </button>
            </>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">或</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          variant="outline"
          className="w-full gap-2"
          size="lg"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          使用 Google 登入
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
