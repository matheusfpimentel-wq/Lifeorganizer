import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useMyTeams, useMyProfile } from '@/features/households/hooks';
import { useUiStore } from '@/stores/ui';
import ErrorBoundary from '@/components/ErrorBoundary';

const NAV_ITEMS = [
  { to: '/', label: 'Hoje', icon: '🏠' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/tarefas', label: 'Tarefas', icon: '✅' },
  { to: '/compras', label: 'Compras', icon: '🛒' },
  { to: '/contas', label: 'Contas', icon: '💰' },
];

const MENU_ITEMS = [
  { to: '/academia', label: 'Academia' },
  { to: '/rotina', label: 'Rotina semanal' },
  { to: '/membros', label: 'Membros' },
  { to: '/staples', label: 'Itens recorrentes' },
  { to: '/configuracoes', label: 'Configurações' },
  { to: '/perfil', label: 'Perfil e Pix' },
];

export default function Layout() {
  const { logout } = useAuth();
  const { household } = useActiveHousehold();
  const { data: myTeams } = useMyTeams();
  const { data: profile } = useMyProfile();
  const setActiveHousehold = useUiStore((s) => s.setActiveHousehold);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        {myTeams && myTeams.length > 1 ? (
          <select
            aria-label="Lar ativo"
            className="input max-w-[60%] !min-h-[40px] !py-1"
            value={household?.$id ?? ''}
            onChange={(e) => setActiveHousehold(e.target.value)}
          >
            {myTeams.map((team) => (
              <option key={team.$id} value={team.$id}>
                {team.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="truncate text-lg font-semibold">{household?.name ?? 'MinhaCasinha'}</span>
        )}

        <div className="relative">
          <button
            aria-label="Menu"
            className="flex h-11 w-11 items-center justify-center rounded-full font-semibold text-white"
            style={{ backgroundColor: profile?.color ?? '#0ea5e9' }}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {(profile?.displayName ?? '?').slice(0, 1).toUpperCase()}
          </button>
          {menuOpen && (
            <nav className="absolute right-0 top-14 z-30 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button
                className="block w-full px-4 py-3 text-left text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => void logout()}
              >
                Sair
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        <ErrorBoundary key={useLocation().pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive ? 'font-semibold text-brand-600' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <span aria-hidden className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
