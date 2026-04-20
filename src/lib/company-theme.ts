/**
 * 多公司色彩識別系統
 * 苗林=indigo, 鮮乳坊/慕渴=orange, MX/溢恩=purple
 */

export interface CompanyTheme {
  name: string;       // 主要顯示名稱
  aliases?: string[]; // 別名（同公司不同稱呼）
  taxId: string;      // 統一編號（8 位數）
  primary: string;    // HSL values (no hsl() wrapper)
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
}

// 已知公司對照表（統編由使用者提供）
export const COMPANY_THEMES: CompanyTheme[] = [
  {
    name: "苗林",
    taxId: "53789651",
    primary: "238 55% 55%",         // indigo
    primaryForeground: "0 0% 100%",
    accent: "238 80% 95%",
    accentForeground: "238 55% 45%",
    ring: "238 55% 55%",
  },
  {
    name: "鮮乳坊",
    aliases: ["慕渴"],
    taxId: "24942234",
    primary: "25 90% 55%",          // orange
    primaryForeground: "0 0% 100%",
    accent: "25 90% 95%",
    accentForeground: "25 80% 40%",
    ring: "25 90% 55%",
  },
  {
    name: "MX",
    aliases: ["溢恩", "MiracleX"],
    taxId: "66446236",
    primary: "270 60% 55%",         // purple
    primaryForeground: "0 0% 100%",
    accent: "270 80% 95%",
    accentForeground: "270 60% 40%",
    ring: "270 60% 55%",
  },
];

// 預設主題 (indigo - 苗林)
const DEFAULT_THEME: CompanyTheme = COMPANY_THEMES[0];

/**
 * 根據統編找到對應的公司主題
 */
export function getCompanyTheme(taxId: string | null): CompanyTheme {
  if (!taxId) return DEFAULT_THEME;
  return COMPANY_THEMES.find((t) => t.taxId === taxId) || DEFAULT_THEME;
}

/**
 * 取得公司顯示名稱（含別名）
 */
export function getCompanyDisplayName(taxId: string): string {
  const theme = COMPANY_THEMES.find((t) => t.taxId === taxId);
  if (!theme) return taxId;
  if (theme.aliases && theme.aliases.length > 0) {
    return `${theme.name} (${theme.aliases.join(" / ")})`;
  }
  return theme.name;
}

/**
 * 將主題套用到 CSS variables
 */
export function applyCompanyTheme(theme: CompanyTheme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-foreground", theme.accentForeground);
  root.style.setProperty("--ring", theme.ring);
}

/**
 * 重置為預設主題
 */
export function resetTheme() {
  applyCompanyTheme(DEFAULT_THEME);
}
