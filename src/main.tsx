import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import App from './App';
import { AuthProvider } from '@/features/auth/AuthContext';
import { applyAccent, applyTheme, useUiStore } from '@/stores/ui';
import '@fontsource-variable/nunito';
import './index.css';

// leitura offline: cache do TanStack Query persistido (ADR-005)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({ storage: window.localStorage });

applyTheme(useUiStore.getState().theme);
applyAccent(useUiStore.getState().accent);
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => applyTheme(useUiStore.getState().theme));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      // buster: muda quando o formato do cache muda, descartando cache antigo
      // (ex.: profiles serializado como Map corrompido em versões anteriores).
      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: 'v2-arrays' }}
    >
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
