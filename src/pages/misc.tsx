/** Páginas de fases futuras e utilitárias (placeholders funcionais). */
import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useActiveHousehold,
  useHouseholdMembers,
  useInviteMember,
  useMyProfile,
  useProfiles,
} from '@/features/households/hooks';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyTheme, useUiStore } from '@/stores/ui';

function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="card text-center text-slate-500">
        <p className="text-4xl">🚧</p>
        <p className="mt-2">Este módulo chega na {phase}.</p>
      </div>
    </div>
  );
}

export function AgendaPage() {
  return <Placeholder title="Agenda" phase="Fase 4 (eventos, recorrência e feed iCal)" />;
}
export function GymPage() {
  return <Placeholder title="Academia" phase="Fase 5 (planos, logger e métricas)" />;
}
export function RoutinePage() {
  return <Placeholder title="Rotina semanal" phase="Fase 4 (grade semanal por membro)" />;
}
export function StaplesPage() {
  return <Placeholder title="Itens recorrentes" phase="Fase 2 (staples da lista de compras)" />;
}

export function MembersPage() {
  const { householdId } = useActiveHousehold();
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.userId), [members]);
  const { data: profiles } = useProfiles(memberIds);
  const invite = useInviteMember(householdId);
  const [email, setEmail] = useState('');

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    invite.mutate({ email }, { onSuccess: () => setEmail('') });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Membros</h1>
      <form className="card flex flex-col gap-3" onSubmit={handleInvite}>
        <label className="label" htmlFor="inviteEmail">Convidar por e-mail</label>
        <div className="flex gap-2">
          <input id="inviteEmail" type="email" className="input flex-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" className="btn-primary" disabled={invite.isPending}>Convidar</button>
        </div>
        {invite.isSuccess && <p className="text-sm text-green-600">Convite enviado!</p>}
        {invite.isError && <p className="text-sm text-red-600">{(invite.error as Error).message}</p>}
      </form>
      <ul className="flex flex-col gap-2">
        {(members ?? []).map((m) => {
          const profile = profiles?.get(m.userId);
          return (
            <li key={m.$id} className="card flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
                style={{ backgroundColor: profile?.color ?? '#94a3b8' }}
              >
                {(profile?.displayName ?? m.userName ?? '?').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{profile?.displayName ?? m.userName ?? m.userEmail}</p>
                <p className="text-sm text-slate-500">{m.confirm ? 'Ativo' : 'Convite pendente'}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Perfil não carregado');
      return tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.profiles,
        rowId: profile.$id,
        data: {
          displayName: displayName ?? profile.displayName,
          color: color ?? profile.color,
          pixKey: pixKey ?? profile.pixKey ?? null,
        },
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['myProfile', user?.$id] }),
  });

  if (!profile) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Perfil e Pix</h1>
      <form
        className="card flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div>
          <label className="label" htmlFor="profName">Nome de exibição</label>
          <input id="profName" className="input" value={displayName ?? profile.displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={64} />
        </div>
        <div>
          <label className="label" htmlFor="profColor">Minha cor</label>
          <input id="profColor" type="color" className="h-11 w-20 rounded-xl" value={color ?? profile.color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="profPix">Chave Pix (para receber acertos)</label>
          <input id="profPix" className="input" placeholder="e-mail, CPF, telefone ou chave aleatória" value={pixKey ?? profile.pixKey ?? ''} onChange={(e) => setPixKey(e.target.value)} maxLength={77} />
        </div>
        <button type="submit" className="btn-primary" disabled={save.isPending}>Salvar</button>
        {save.isSuccess && <p className="text-sm text-green-600">Salvo!</p>}
        {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
      </form>
    </div>
  );
}

export function SettingsPage() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <section className="card flex flex-col gap-3">
        <h2 className="font-semibold">Aparência</h2>
        <label className="label" htmlFor="themeSelect">Tema</label>
        <select
          id="themeSelect"
          className="input"
          value={theme}
          onChange={(e) => {
            const value = e.target.value as 'system' | 'light' | 'dark';
            setTheme(value);
            applyTheme(value);
          }}
        >
          <option value="system">Automático (sistema)</option>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </select>
      </section>
      <section className="card flex flex-col gap-3">
        <h2 className="font-semibold">Notificações</h2>
        <p className="text-sm text-slate-500">
          Onboarding de push (iOS/Android) e teste de notificação chegam na Fase 6.
        </p>
        <button className="btn-secondary" disabled>Testar notificação</button>
      </section>
    </div>
  );
}
