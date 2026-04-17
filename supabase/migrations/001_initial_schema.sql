-- =====================================================
-- AI 發票報帳神器 — 一鍵設定 SQL
-- 在 Supabase Dashboard → SQL Editor 整段貼上 → Run
-- 重複執行不會出錯（idempotent）
-- =====================================================

-- ─── 1. expenses 資料表 ──────────────────────────────
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null,
  store text not null,
  amount numeric not null check (amount >= 0),
  category text not null,
  notes text default '',
  tax_id text default '',
  company_name text default '',
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 索引：依日期排序查詢、依使用者過濾、依公司過濾
create index if not exists expenses_user_date_idx
  on public.expenses (user_id, date desc);
create index if not exists expenses_tax_id_idx
  on public.expenses (tax_id) where tax_id <> '';

-- 自動更新 updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ─── 2. expenses RLS 政策 ────────────────────────────
alter table public.expenses enable row level security;

drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- ─── 3. receipts Storage bucket ──────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  true,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── 4. receipts Storage RLS 政策 ────────────────────
-- 使用者只能上傳到自己 user_id 子資料夾
drop policy if exists "Users can upload own receipts" on storage.objects;
create policy "Users can upload own receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 任何人可以「讀」（因為 bucket 是 public，公開 URL 才能在 <img> 顯示）
drop policy if exists "Anyone can view receipts" on storage.objects;
create policy "Anyone can view receipts"
  on storage.objects for select
  using (bucket_id = 'receipts');

-- 使用者可以刪除自己的收據
drop policy if exists "Users can delete own receipts" on storage.objects;
create policy "Users can delete own receipts"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── 完成 ────────────────────────────────────────────
-- 驗證：應該回傳 1 列「expenses」資料表 + 1 列「receipts」bucket
select
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'expenses') as expenses_table,
  (select count(*) from storage.buckets where id = 'receipts') as receipts_bucket;
