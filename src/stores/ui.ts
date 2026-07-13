/** Estado de UI mínimo (Zustand): lar ativo, filtro por membro, tema. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Accent =
  | 'ceu' | 'uva' | 'rosa' | 'mata' | 'sol' | 'oceano'
  | 'tomate' | 'pitaya' | 'lavanda' | 'lima' | 'mel' | 'grafite';

interface UiState {
  activeHouseholdId: string | null; // teamId
  memberFilter: string | null; // null = todos
  theme: 'system' | 'light' | 'dark';
  accent: Accent;
  setActiveHousehold: (teamId: string | null) => void;
  setMemberFilter: (memberId: string | null) => void;
  setTheme: (theme: UiState['theme']) => void;
  setAccent: (accent: Accent) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeHouseholdId: null,
      memberFilter: null,
      theme: 'system',
      accent: 'ceu',
      setActiveHousehold: (teamId) => set({ activeHouseholdId: teamId, memberFilter: null }),
      setMemberFilter: (memberId) => set({ memberFilter: memberId }),
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
    }),
    { name: 'morada-ui' },
  ),
);

export function applyTheme(theme: UiState['theme']): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}

/** Paletas de acento (hex Tailwind); nome pt-BR para o seletor. */
export const ACCENTS: Record<Accent, { label: string; shades: Record<number, string> }> = {
  ceu: { label: 'Céu', shades: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' } },
  uva: { label: 'Uva', shades: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' } },
  rosa: { label: 'Rosa', shades: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' } },
  mata: { label: 'Mata', shades: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' } },
  sol: { label: 'Pôr do sol', shades: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' } },
  oceano: { label: 'Oceano', shades: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' } },
  tomate: { label: 'Tomate', shades: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' } },
  pitaya: { label: 'Pitaya', shades: { 50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75' } },
  lavanda: { label: 'Lavanda', shades: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' } },
  lima: { label: 'Lima', shades: { 50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212', 900: '#365314' } },
  mel: { label: 'Mel', shades: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' } },
  grafite: { label: 'Grafite', shades: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' } },
};

function hexToTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Aplica a paleta de acento nas variáveis CSS (--brand-N). */
export function applyAccent(accent: Accent): void {
  const palette = ACCENTS[accent] ?? ACCENTS.ceu;
  for (const [shade, hex] of Object.entries(palette.shades)) {
    document.documentElement.style.setProperty(`--brand-${shade}`, hexToTriplet(hex));
  }
}
