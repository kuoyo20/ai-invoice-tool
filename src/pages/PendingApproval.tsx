import React from "react";
import { Clock, LogOut, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

const PendingApproval: React.FC = () => {
  const { user, signOut } = useAuth();
  const { refetch } = useProfile();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-soft p-8 max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            等待管理員審核
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            您的帳號已成功註冊，但尚未開通使用權限。
            <br />
            請等待管理員審核通過，通常 1 個工作日內處理。
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{user?.email}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            審核通過後，重新整理頁面即可使用
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" />
            重新檢查
          </Button>
          <Button variant="ghost" className="gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            登出
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          如有疑問，請聯絡系統管理員
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
