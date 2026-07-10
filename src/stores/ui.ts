/** Estado de UI mínimo (Zustand): lar ativo, filtro por membro, tema. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  activeHouseholdId: string | null; // teamId
  memberFilter: string | null; // null = todos
  theme: 'system' | 'light' | 'dark';
  setActiveHousehold: (teamId: string | null) => void;
  setMemberFilter: (memberId: string | null) => void;
  setTheme: (theme: UiState['theme']) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeHouseholdId: null,
      memberFilter: null,
      theme: 'system',
      setActiveHousehold: (teamId) => set({ activeHouseholdId: teamId, memberFilter: null }),
      setMemberFilter: (memberId) => set({ memberFilter: memberId }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'morada-ui' },
  ),
);

export function applyTheme(theme: UiState['theme']): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}
