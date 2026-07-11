/** Estado de UI mínimo (Zustand): lar ativo, filtro por membro, tema. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Accent = 'ceu' | 'uva' | 'rosa' | 'mata' | 'sol' | 'oceano';

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
