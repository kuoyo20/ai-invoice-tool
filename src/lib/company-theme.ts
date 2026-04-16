/**
 * 多公司色彩識別系統
 * 苗林=indigo, 點點=emerald, 鮮乳坊=orange, MiracleX=purple
 */

export interface CompanyTheme {
  name: string;
  taxId: string;
  primary: string;         // HSL values (no hsl() wrapper)
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
}

// 已知公司色彩對照表
export const COMPANY_THEMES: CompanyTheme[] = [
  {
    name: "苗林實業",
    taxId: "22099131",
    primary: "238 55% 55%",         // indigo
    primaryForeground: "0 0% 100%",
    accent: "238 80% 95%",
    accentForeground: "238 55% 45%",
    ring: "238 55% 55%",
  },
  {
    name: "點點全球",
    taxId: "90562460",
    primary: "152 60% 42%",         // emerald
    primaryForeground: "0 0% 100%",
    accent: "152 80% 93%",
    accentForeground: "152 60% 32%",
    ring: "152 60% 42%",
  },
  {
    name: "鮮乳坊",
    taxId: "42636862",
    primary: "25 90% 55%",          // orange
    primaryForeground: "0 0% 100%",
    accent: "25 90% 95%",
    accentForeground: "25 80% 40%",
    ring: "25 90% 55%",
  },
  {
    name: "MiracleX",
    taxId: "94391028",
    primary: "270 60% 55%",         // purple
    primaryForeground: "0 0% 100%",
    accent: "270 80% 95%",
    accentForeground: "270 60% 40%",
    ring: "270 60% 55%",
  },
];

// 預設主題 (indigo)
const DEFAULT_THEME: CompanyTheme = COMPANY_THEMES[0];

/**
 * 根據統編找到對應的公司主題
 */
export function getCompanyTheme(taxId: string | null): CompanyTheme {
  if (!taxId) return DEFAULT_THEME;
  return COMPANY_THEMES.find((t) => t.taxId === taxId) || DEFAULT_THEME;
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
