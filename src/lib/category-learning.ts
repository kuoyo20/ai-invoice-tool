/**
 * 分類學習系統
 * 記錄使用者對 AI 分類的修改，下次遇到同店家優先套用偏好
 * 不需要 fine-tune，在 prompt 裡加 few-shot examples 即可
 */

const STORAGE_KEY = "expense-category-preferences";
const MAX_ENTRIES = 200;

interface CategoryPreference {
  store: string;
  category: string;
  count: number; // 被選擇的次數，越高越可信
}

export function getCategoryPreferences(): CategoryPreference[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 記錄使用者的分類選擇
 * 每次使用者修改 AI 的分類判斷時呼叫
 */
export function learnCategoryPreference(store: string, category: string) {
  const prefs = getCategoryPreferences();
  const normalized = store.trim().toLowerCase();

  const existing = prefs.find((p) => p.store.toLowerCase() === normalized);
  if (existing) {
    existing.category = category;
    existing.count += 1;
    existing.store = store.trim(); // 保留原始大小寫
  } else {
    prefs.push({ store: store.trim(), category, count: 1 });
  }

  // 保留最多 MAX_ENTRIES 筆，按 count 排序保留最常用的
  const trimmed = prefs.sort((a, b) => b.count - a.count).slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * 查詢某店家的偏好分類
 */
export function getPreferredCategory(store: string): string | null {
  const prefs = getCategoryPreferences();
  const normalized = store.trim().toLowerCase();
  const match = prefs.find((p) => p.store.toLowerCase() === normalized);
  return match ? match.category : null;
}

/**
 * 產生 few-shot examples 字串，注入到 AI prompt 中
 * 只取 count >= 2 的（至少被確認過兩次）
 */
export function generateFewShotExamples(): string {
  const prefs = getCategoryPreferences().filter((p) => p.count >= 2);
  if (prefs.length === 0) return "";

  const examples = prefs
    .slice(0, 20) // 最多 20 個範例避免 prompt 過長
    .map((p) => `- ${p.store} → ${p.category}`)
    .join("\n");

  return `\n\n**使用者的分類偏好（請優先參考）：**\n${examples}`;
}
