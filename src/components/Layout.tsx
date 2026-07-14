import { Suspense, useState, type ComponentType, type SVGProps } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useActiveHousehold, useMyTeams, useMyProfile } from '@/features/households/hooks';
import { useUiStore } from '@/stores/ui';
import ErrorBoundary from '@/components/ErrorBoundary';
import QuickAdd from '@/components/QuickAdd';
import { Icon } from '@/components/icons';
import { AVATARS, BuiltinAvatar } from '@/components/avatars';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const NAV_ITEMS: { to: string; label: string; icon: IconType }[] = [
  { to: '/', label: 'Hoje', icon: Icon.Home },
  { to: '/agenda', label: 'Agenda', icon: Icon.Calendar },
  { to: '/tarefas', label: 'Tarefas', icon: Icon.CheckSquare },
  { to: '/compras', label: 'Mercado', icon: Icon.Store },
  { to: '/contas', label: 'Contas', icon: Icon.Bank },
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
      {/* brilho de fundo no tom do tema (estilo Vistage) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(900px 520px at 50% -140px, rgb(var(--brand-300) / 0.32), transparent 70%)' }}
      />
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-white/70 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-xl dark:bg-slate-950/70">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative shrink-0">
            <button
              aria-label="Menu"
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-md ring-2 ring-white/70 transition-transform active:scale-90 dark:ring-slate-700"
              style={profile?.avatar && AVATARS[profile.avatar as string] ? undefined : { backgroundColor: profile?.color ?? '#0ea5e9' }}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {profile?.avatar && AVATARS[profile.avatar as string] ? (
                <BuiltinAvatar slug={profile.avatar as string} className="h-full w-full" />
              ) : (
                (profile?.displayName ?? '?').slice(0, 1).toUpperCase()
              )}
            </button>
            {menuOpen && (
              <nav className="absolute left-0 top-14 z-30 w-60 rounded-2xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
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
          {myTeams && myTeams.length > 1 ? (
            <select
              aria-label="Lar ativo"
              className="input max-w-[56vw] !min-h-[40px] !border-0 !bg-transparent !py-1 text-lg font-bold"
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
            <span className="truncate text-lg font-bold">{household?.name ?? 'MinhaCasinha'}</span>
          )}
        </div>

        <QuickAdd />
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <ErrorBoundary key={useLocation().pathname}>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <nav
        className="fixed inset-x-3 z-20 mx-auto max-w-3xl rounded-3xl border border-white/50 bg-white/85 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <div className="grid grid-cols-5 p-1.5">
          {NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-600/15 font-semibold text-brand-600 dark:bg-brand-400/15 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ItemIcon className={`h-5 w-5 ${isActive ? 'motion-safe:animate-pop' : ''}`} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
