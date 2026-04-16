# AI 發票報帳神器 — 本地部署指南

## 從 Lovable 遷移完成的變更

| 項目 | 原 Lovable 版本 | 遷移後 |
|------|----------------|--------|
| 認證 | `@lovable.dev/cloud-auth-js` | 原生 Supabase Google OAuth |
| AI 辨識 | Lovable AI Gateway (`ai.gateway.lovable.dev`) | Google Gemini API 直呼 |
| Vite 插件 | `lovable-tagger` | 已移除 |
| 依賴 | Lovable 私有套件 | 全部公開 npm 套件 |

---

## 一、前置需求

- Node.js >= 18
- npm 或 pnpm
- Supabase CLI (`npm install -g supabase`)
- Google Cloud Console 帳號（OAuth + Gemini API Key）

---

## 二、Supabase 設定

### 2.1 資料庫（已存在的 project: `uaqggryklaalvqxzduei`）

如果 expenses 表尚未建立，執行以下 SQL：

```sql
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  store TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  tax_id TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### 2.2 Google OAuth 設定

1. 到 [Google Cloud Console](https://console.cloud.google.com) 建立 OAuth 2.0 Client ID
2. Authorized redirect URIs 加入：
   - `https://uaqggryklaalvqxzduei.supabase.co/auth/v1/callback`
   - `http://localhost:5173`（本地開發用）
3. 到 Supabase Dashboard → Authentication → Providers → Google
4. 填入 Client ID 和 Client Secret，啟用

### 2.3 Gemini API Key

1. 到 [Google AI Studio](https://aistudio.google.com/apikey) 取得 API Key
2. 到 Supabase Dashboard → Edge Functions → Secrets
3. 新增 Secret：`GOOGLE_GEMINI_API_KEY` = 你的 key

---

## 三、本地開發

```bash
# 1. 安裝依賴
npm install

# 2. 安裝 shadcn/ui 元件（首次需要）
npx shadcn@latest add button input label dialog select popover calendar tooltip toast sonner

# 3. 建立 .env 檔
cp .env.example .env
# 編輯 .env，填入你的 Supabase anon key

# 4. 啟動
npm run dev
```

開啟 http://localhost:5173

---

## 四、部署 Edge Function

```bash
# 登入 Supabase CLI
supabase login

# 連結專案
supabase link --project-ref uaqggryklaalvqxzduei

# 部署 process-receipt function
supabase functions deploy process-receipt --no-verify-jwt

# 設定 Gemini API Key（如果還沒在 Dashboard 設定）
supabase secrets set GOOGLE_GEMINI_API_KEY=your_key_here
```

---

## 五、前端部署

### Vercel（推薦）

```bash
npm run build
# 上傳 dist/ 到 Vercel，設定環境變數：
# VITE_SUPABASE_URL
# VITE_SUPABASE_PUBLISHABLE_KEY
```

### Netlify

同上，build command: `npm run build`，publish directory: `dist`

---

## 六、專案結構

```
ai-invoice-tool/
├── src/
│   ├── components/          # UI 元件
│   │   ├── EditExpenseDialog.tsx
│   │   ├── ExpenseDashboard.tsx  # 圓餅圖 + 長條圖
│   │   ├── ExpenseTable.tsx      # 報帳明細表
│   │   ├── ManualEntryDialog.tsx  # 手動新增
│   │   ├── UploadZone.tsx        # 拖曳上傳
│   │   └── ui/                   # shadcn/ui 元件
│   ├── hooks/
│   │   ├── use-auth.ts           # Supabase auth hook
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Supabase 客戶端
│   │       └── types.ts          # DB 型別
│   ├── lib/
│   │   ├── receipt-service.ts    # CRUD + AI 辨識 + CSV 匯出
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Index.tsx             # 主頁面
│   │   ├── LoginPage.tsx         # Google 登入
│   │   └── NotFound.tsx
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   └── functions/
│       └── process-receipt/
│           └── index.ts          # Gemini API 發票辨識
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.app.json
└── vite.config.ts
```

---

## 七、資料庫遷移（新增欄位）

如果你的 expenses 表已經存在，執行以下 SQL 加入新欄位：

```sql
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT DEFAULT NULL;
```

---

## 八、Supabase Storage 設定（收據圖片存儲）

1. Supabase Dashboard → Storage → New Bucket
2. 名稱：`receipts`
3. 設為 **Public**（讓前端可以直接取得圖片 URL）
4. 新增 RLS Policy（限制使用者只能上傳自己資料夾的檔案）：

```sql
-- 允許登入使用者上傳到自己的資料夾
CREATE POLICY "Users can upload own receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 允許所有人讀取（Public bucket）
CREATE POLICY "Public read receipts" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'receipts');
```

---

## 九、v2.0 新增功能

| 功能 | 說明 |
|------|------|
| 圖片壓縮 | 上傳前自動 resize 到 1600px，節省 3-5 倍頻寬 |
| React Query | 樂觀更新、自動重試、錯誤回滾 |
| 收據存圖 | 原始收據存 Supabase Storage，表格可點擊查看原圖 |
| 刪除 Undo | 刪除後 5 秒內可復原，防誤操作 |
| 重複偵測 | 同日期+店家+金額自動警告，可選擇跳過或仍然新增 |
| 分類學習 | 記錄使用者修改，下次同店家自動套用偏好分類 |
| 金額驗證 | AI 回傳金額與品項明細交叉比對，不一致標記警告 |
| 公司主題色 | 苗林=indigo 點點=emerald 鮮乳坊=orange MX=purple |

---

## 十、後續開發方向

- [ ] LINE Bot 整合（拍照直接報帳）
- [ ] 審批工作流（主管簽核）
- [ ] 月結報表自動產生
- [ ] 多幣種支援（出差報帳）
