/**
 * Estado da sessão ao vivo do Treino + preferências. Persistido em localStorage
 * (Zustand): a sessão inteira sobrevive a refresh/queda e funciona 100% offline.
 * A sincronização com o Appwrite é feita fora daqui (hooks + fila de sync).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LoggedSet {
  setId: string; // rowId no Appwrite (para desfazer/sincronizar)
  stepIndex: number;
  exerciseKey: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir: number | null;
  technique?: string | null; // técnica intensa aplicada (fase Intensificar)
  at: string; // ISO
}

export interface ActiveSession {
  sessionId: string; // ID.unique() gerado no cliente
  memberId: string;
  templateKey: string;
  week: number;
  phaseName: string;
  deload: boolean;
  startedAt: string;
  index: number; // passo atual
  logs: LoggedSet[];
}

export interface TrainingSettings {
  units: 'kg' | 'lb';
  sound: boolean;
  vibration: boolean;
  incrementCompound: number;
  incrementIsolation: number;
  proteinTargetG: number;
}

const DEFAULT_SETTINGS: TrainingSettings = {
  units: 'kg',
  sound: true,
  vibration: true,
  incrementCompound: 2.5,
  incrementIsolation: 1.0,
  proteinTargetG: 180,
};

export interface CoachReview {
  resumo: string;
  progredir: string[];
  estagnou: string[];
  deload: boolean;
  nudge: string;
}

interface TrainingState {
  active: ActiveSession | null;
  settings: TrainingSettings;
  /** aviso de peso corporal: ISO da última vez que sugerimos (máx 1×/semana). */
  lastBodyweightPromptAt: string | null;
  /** revisão de coach mais recente, com a semana a que se refere. */
  lastReview: { week: number; at: string; review: CoachReview } | null;
  start: (s: Omit<ActiveSession, 'index' | 'logs'>) => void;
  logSet: (l: LoggedSet) => void;
  undoLast: () => LoggedSet | null;
  goTo: (index: number) => void;
  finish: () => void;
  cancel: () => void;
  setSettings: (patch: Partial<TrainingSettings>) => void;
  markBodyweightPrompt: (iso: string) => void;
  setReview: (week: number, review: CoachReview) => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      active: null,
      settings: DEFAULT_SETTINGS,
      lastBodyweightPromptAt: null,
      lastReview: null,
      start: (s) => set({ active: { ...s, index: 0, logs: [] } }),
      logSet: (l) =>
        set((state) =>
          state.active
            ? { active: { ...state.active, logs: [...state.active.logs, l], index: state.active.index + 1 } }
            : state,
        ),
      undoLast: () => {
        const active = get().active;
        if (!active || active.logs.length === 0) return null;
        const last = active.logs[active.logs.length - 1];
        set({ active: { ...active, logs: active.logs.slice(0, -1), index: last.stepIndex } });
        return last;
      },
      goTo: (index) => set((state) => (state.active ? { active: { ...state.active, index } } : state)),
      finish: () => set({ active: null }),
      cancel: () => set({ active: null }),
      setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      markBodyweightPrompt: (iso) => set({ lastBodyweightPromptAt: iso }),
      setReview: (week, review) => set({ lastReview: { week, at: new Date().toISOString(), review } }),
    }),
    { name: 'training' },
  ),
);
