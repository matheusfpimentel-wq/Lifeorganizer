import { Suspense, useState, type ComponentType, type SVGProps } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useMyTeams, useMyProfile } from '@/features/households/hooks';
import { useUiStore } from '@/stores/ui';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Icon } from '@/components/icons';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const NAV_ITEMS: { to: string; label: string; icon: IconType }[] = [
  { to: '/', label: 'Hoje', icon: Icon.Home },
  { to: '/agenda', label: 'Agenda', icon: Icon.Calendar },
  { to: '/tarefas', label: 'Tarefas', icon: Icon.CheckSquare },
  { to: '/compras', label: 'Mercado', icon: Icon.Store },
  { to: '/contas', label: 'Banco', icon: Icon.Bank },
];

const MENU_ITEMS: { to: string; label: string; icon: IconType }[] = [
  { to: '/academia', label: 'Academia', icon: Icon.Dumbbell },
  { to: '/rotina', label: 'Rotina semanal', icon: Icon.Repeat },
  { to: '/membros', label: 'Membros', icon: Icon.Users },
  { to: '/staples', label: 'Itens recorrentes', icon: Icon.List },
  { to: '/configuracoes', label: 'Configurações', icon: Icon.Settings },
  { to: '/perfil', label: 'Perfil e Pix', icon: Icon.User },
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
            className="flex h-11 w-11 items-center justify-center rounded-full font-semibold text-white shadow-sm"
            style={{ backgroundColor: profile?.color ?? '#0ea5e9' }}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {(profile?.displayName ?? '?').slice(0, 1).toUpperCase()}
          </button>
          {menuOpen && (
            <nav className="absolute right-0 top-14 z-30 w-60 rounded-2xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {MENU_ITEMS.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ItemIcon className="h-5 w-5 text-slate-400" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => void logout()}
              >
                <Icon.LogOut className="h-5 w-5" />
                Sair
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        <ErrorBoundary key={useLocation().pathname}>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] ${
                    isActive ? 'font-semibold text-brand-600' : 'text-slate-500 dark:text-slate-400'
                  }`
                }
              >
                <ItemIcon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
