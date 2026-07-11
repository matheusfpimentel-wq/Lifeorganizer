/** Páginas de fases futuras e utilitárias (placeholders funcionais). */
import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useActiveHousehold,
  useHouseholdMembers,
  useInviteMember,
  useMyProfile,
  useMyTeams,
  useProfiles,
} from '@/features/households/hooks';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { withPersonalPermissions } from '@/lib/permissions';
import { ID } from 'appwrite';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyTheme, useUiStore } from '@/stores/ui';

const PROFILE_COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#14b8a6'];

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
  const { data: profile, isLoading } = useMyProfile();
  const { data: myTeams } = useMyTeams();
  const queryClient = useQueryClient();

  // controlado; inicia vazio e cai para os valores do perfil (ou defaults)
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string | null>(null);

  const currentName = displayName ?? profile?.displayName ?? user?.name ?? user?.email ?? '';
  const currentColor = color ?? profile?.color ?? PROFILE_COLORS[0];
  const currentPix = pixKey ?? profile?.pixKey ?? '';

  // upsert: cria a linha se o usuário ainda não tem perfil; senão, atualiza
  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      const data = { displayName: currentName, color: currentColor, pixKey: currentPix || null };
      if (profile) {
        return tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLES.profiles, rowId: profile.$id, data });
      }
      const teamIds = (myTeams ?? []).map((t) => t.$id);
      try {
        return await tablesDB.createRow({
          databaseId: DB_ID,
          tableId: TABLES.profiles,
          rowId: ID.unique(),
          data: { userId: user.$id, ...data },
          permissions: withPersonalPermissions(user.$id, teamIds),
        });
      } catch (err) {
        // índice único de userId: já existe um perfil (possivelmente sem permissão
        // de leitura). Mensagem amigável em vez de erro cru.
        if ((err as { code?: number }).code === 409) {
          throw new Error('Você já tem um perfil neste projeto. Recarregue a página para editá-lo.');
        }
        throw err;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['myProfile', user?.$id] });
      void queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Perfil e Pix</h1>
      {!profile && (
        <p className="text-sm text-slate-500">Complete seu perfil para aparecer com nome e cor no lar.</p>
      )}
      <form
        className="card flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div>
          <label className="label" htmlFor="profName">Nome de exibição</label>
          <input id="profName" className="input" value={currentName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={64} />
        </div>
        <div>
          <label className="label" htmlFor="profColor">Minha cor</label>
          <input id="profColor" type="color" className="h-11 w-20 rounded-xl" value={currentColor} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="profPix">Chave Pix (para receber acertos)</label>
          <input id="profPix" className="input" placeholder="e-mail, CPF, telefone ou chave aleatória" value={currentPix} onChange={(e) => setPixKey(e.target.value)} maxLength={77} />
        </div>
        <button type="submit" className="btn-primary" disabled={save.isPending}>
          {profile ? 'Salvar' : 'Criar perfil'}
        </button>
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
