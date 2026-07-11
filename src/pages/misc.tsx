/** Páginas de fases futuras e utilitárias (placeholders funcionais). */
import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useActiveHousehold,
  useHouseholdMembers,
  useHouseholdMeta,
  useHouseholdPeople,
  useInviteMember,
  useMyProfile,
  useMyTeams,
  useProfiles,
  useRemoveMember,
} from '@/features/households/hooks';
import type { Models } from 'appwrite';
import { Icon } from '@/components/icons';
import { AVATARS, AVATAR_SLUGS, BuiltinAvatar } from '@/components/avatars';
import { DB_ID, TABLES, tablesDB } from '@/lib/appwrite';
import { listAllRows } from '@/lib/pagination';
import { withPersonalPermissions } from '@/lib/permissions';
import { Query } from 'appwrite';
import {
  API_FUNCTION_URL,
  useCreateIcalToken,
  useIcalToken,
  useRevokeIcalToken,
} from '@/features/ical/hooks';
import {
  isIOS,
  isStandalone,
  PUSH_SUPPORTED,
  useEnablePush,
  usePushState,
  useTestPush,
} from '@/features/push/hooks';
import { ID } from 'appwrite';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyTheme, useUiStore } from '@/stores/ui';

const PROFILE_COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#14b8a6'];

export function MembersPage() {
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const { data: members } = useHouseholdMembers(householdId);
  const memberIds = useMemo(() => (members ?? []).map((m) => m.userId), [members]);
  const { data: profiles } = useProfiles(memberIds);
  const invite = useInviteMember(householdId);
  const removeMember = useRemoveMember(householdId);
  const [email, setEmail] = useState('');

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    invite.mutate({ email }, { onSuccess: () => setEmail('') });
  }

  function displayFor(m: Models.Membership): string {
    const profile = profiles?.get(m.userId);
    return profile?.displayName || m.userName || m.userEmail || 'Convidado(a)';
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
        {invite.isSuccess && <p className="text-sm text-green-600">Convite enviado. Peça para checar a caixa de entrada (e o spam).</p>}
        {invite.isError && <p className="text-sm text-red-600">{(invite.error as Error).message}</p>}
      </form>

      <ul className="flex flex-col gap-2">
        {(members ?? []).map((m) => {
          const profile = profiles?.get(m.userId);
          const name = displayFor(m);
          const isMe = m.userId === user?.$id;
          return (
            <li key={m.$id} className="card flex items-center gap-3">
              {profile?.avatar && AVATARS[profile.avatar as string] ? (
                <BuiltinAvatar slug={profile.avatar as string} className="h-10 w-10 shrink-0 rounded-full" />
              ) : (
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white"
                  style={{ backgroundColor: profile?.color ?? '#94a3b8' }}
                >
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {name}
                  {isMe && <span className="ml-1 text-sm font-normal text-slate-400">(você)</span>}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {m.userEmail && m.userEmail !== name ? `${m.userEmail} · ` : ''}
                  {m.confirm ? 'Ativo' : 'Convite pendente'}
                </p>
              </div>
              {!isMe && (
                <button
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  aria-label={m.confirm ? `Remover ${name}` : `Cancelar convite de ${name}`}
                  onClick={() => {
                    const question = m.confirm
                      ? `Remover ${name} do lar?`
                      : `Cancelar o convite de ${name}?`;
                    if (confirm(question)) removeMember.mutate(m.$id);
                  }}
                >
                  <Icon.Trash className="h-5 w-5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {removeMember.isError && (
        <p className="text-sm text-red-600">{(removeMember.error as Error).message}</p>
      )}
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
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);

  const currentName = displayName ?? profile?.displayName ?? user?.name ?? user?.email ?? '';
  const currentColor = color ?? profile?.color ?? PROFILE_COLORS[0];
  const currentPix = pixKey ?? profile?.pixKey ?? '';
  const currentAvatar = avatar === undefined ? ((profile?.avatar as string | undefined) ?? null) : avatar;

  // upsert: cria a linha se o usuário ainda não tem perfil; senão, atualiza
  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      const data = {
        displayName: currentName,
        color: currentColor,
        pixKey: currentPix || null,
        avatar: currentAvatar,
      };
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
          <span className="label">Avatar</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            <button
              type="button"
              aria-label="Sem avatar (inicial colorida)"
              aria-pressed={currentAvatar === null}
              onClick={() => setAvatar(null)}
              className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-lg font-bold text-white transition-transform active:scale-90 ${currentAvatar === null ? 'border-brand-600' : 'border-transparent'}`}
              style={{ backgroundColor: currentColor }}
            >
              {currentName.slice(0, 1).toUpperCase() || '?'}
            </button>
            {AVATAR_SLUGS.map((slug) => (
              <button
                key={slug}
                type="button"
                aria-label={AVATARS[slug].label}
                aria-pressed={currentAvatar === slug}
                onClick={() => setAvatar(slug)}
                className={`aspect-square overflow-hidden rounded-2xl border-2 transition-transform active:scale-90 ${currentAvatar === slug ? 'border-brand-600 scale-105' : 'border-transparent'}`}
                title={AVATARS[slug].label}
              >
                <BuiltinAvatar slug={slug} className="h-full w-full" />
              </button>
            ))}
          </div>
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
  const { householdId } = useActiveHousehold();
  const icalToken = useIcalToken(householdId);
  const createToken = useCreateIcalToken(householdId);
  const revokeToken = useRevokeIcalToken(householdId);

  const feedUrl =
    API_FUNCTION_URL && icalToken.data
      ? `${API_FUNCTION_URL.replace(/\/$/, '')}/ical/${icalToken.data.token}`
      : null;

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
        <h2 className="font-semibold">Sincronizar com o Google Agenda</h2>
        <p className="text-sm text-slate-500">
          Gere um link privado (iCal) com seus eventos e tarefas e adicione no Google Agenda em
          "Adicionar agenda → Por URL".
        </p>
        {!API_FUNCTION_URL ? (
          <p className="text-sm text-amber-600">
            Configure <code>VITE_API_FUNCTION_URL</code> (URL pública da function <code>api</code>) para
            habilitar o feed.
          </p>
        ) : icalToken.isLoading ? (
          <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : feedUrl ? (
          <div className="flex flex-col gap-2">
            <input className="input text-xs" readOnly value={feedUrl} onFocus={(e) => e.currentTarget.select()} />
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => navigator.clipboard.writeText(feedUrl)}>
                Copiar link
              </button>
              <button
                className="btn-secondary text-red-600"
                onClick={() => icalToken.data && revokeToken.mutate(icalToken.data.$id)}
              >
                Revogar
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-primary" onClick={() => createToken.mutate()} disabled={createToken.isPending}>
            Gerar link do calendário
          </button>
        )}
      </section>

      <ProportionalSettings />
      <VacationSettings />
      <NotificationsSettings />
      <DataSettings />
    </div>
  );
}

function DataSettings() {
  const { user, logout } = useAuth();
  const { householdId } = useActiveHousehold();
  const [busy, setBusy] = useState(false);

  const EXPORT_TABLES: (keyof typeof TABLES)[] = [
    'events', 'routineBlocks', 'tasks', 'taskOccurrences', 'shoppingLists', 'shoppingItems',
    'staples', 'expenses', 'settlements', 'workoutPlans', 'workoutSessions', 'workoutSessionSets',
  ];

  async function handleExport() {
    if (!householdId) return;
    setBusy(true);
    try {
      const dump: Record<string, unknown> = { exportedAt: new Date().toISOString(), householdId };
      for (const key of EXPORT_TABLES) {
        dump[key] = await listAllRows(TABLES[key], [Query.equal('householdId', householdId)]);
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minhacasinha-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePersonal() {
    if (!user) return;
    if (!confirm('Apagar seus dados pessoais (perfil, notificações e links de calendário) e sair? Os dados compartilhados do lar não são afetados.')) return;
    setBusy(true);
    try {
      for (const table of [TABLES.profiles, TABLES.pushSubscriptions, TABLES.icalTokens]) {
        const rows = await listAllRows<{ $id: string }>(table, [Query.equal('userId', user.$id)]);
        for (const row of rows) {
          await tablesDB.deleteRow({ databaseId: DB_ID, tableId: table, rowId: row.$id });
        }
      }
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="font-semibold">Meus dados</h2>
      <button className="btn-secondary" onClick={handleExport} disabled={busy || !householdId}>
        {busy ? 'Processando…' : 'Exportar dados do lar (JSON)'}
      </button>
      <button className="btn-secondary text-red-600" onClick={handleDeletePersonal} disabled={busy}>
        Apagar meus dados pessoais
      </button>
      <p className="text-xs text-slate-400">
        Apagar remove seu perfil, assinaturas de notificação e links de calendário, e encerra a sessão.
        A exclusão da conta de login em si é feita pelo suporte.
      </p>
    </section>
  );
}

/**
 * Resumo diário único: horário (BRT) guardado em profile.notificationPrefs.
 * Um push por dia com tarefas, eventos e dia de compras — enviado pela `tick`.
 */
function DailySummarySettings() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();

  const currentPrefs = (() => {
    try {
      return profile?.notificationPrefs ? JSON.parse(profile.notificationPrefs as unknown as string) : {};
    } catch {
      return {};
    }
  })();
  const currentTime: string | null = currentPrefs.dailySummaryTime ?? null;
  const [time, setTime] = useState(currentTime ?? '07:30');

  const save = useMutation({
    mutationFn: async (dailySummaryTime: string | null) => {
      if (!profile) throw new Error('Crie seu perfil em "Perfil e Pix" primeiro.');
      return tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.profiles,
        rowId: profile.$id,
        data: { notificationPrefs: JSON.stringify({ ...currentPrefs, dailySummaryTime }) },
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['myProfile', user?.$id] }),
  });

  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
      <p className="font-medium">Resumo do dia</p>
      <p className="mt-0.5 text-sm text-slate-500">
        Uma única notificação por dia com suas tarefas, eventos e o dia de compras.
      </p>
      {currentTime ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="time"
            aria-label="Horário do resumo"
            className="input !min-h-[40px] max-w-[120px]"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onBlur={() => time && time !== currentTime && save.mutate(time)}
          />
          <button className="btn-secondary !min-h-[40px]" onClick={() => save.mutate(null)} disabled={save.isPending}>
            Desativar
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="time"
            aria-label="Horário do resumo"
            className="input !min-h-[40px] max-w-[120px]"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <button className="btn-primary !min-h-[40px]" onClick={() => save.mutate(time)} disabled={save.isPending}>
            Ativar
          </button>
        </div>
      )}
      {save.isError && <p className="mt-1 text-sm text-red-600">{(save.error as Error).message}</p>}
    </div>
  );
}

/**
 * Proporção combinada para dividir contas (ex.: 60/40 quando as rendas são
 * diferentes). Fica em households.settings.splitRatio e habilita o tipo
 * "Proporcional" no lançamento de despesas.
 */
function ProportionalSettings() {
  const { householdId } = useActiveHousehold();
  const { people } = useHouseholdPeople(householdId);
  const meta = useHouseholdMeta(householdId);
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string> | null>(null);

  const saved: Record<string, number> = (() => {
    try {
      return meta.data?.settings ? (JSON.parse(meta.data.settings as string).splitRatio ?? {}) : {};
    } catch {
      return {};
    }
  })();
  const current = values ?? Object.fromEntries(people.map((p) => [p.id, saved[p.id] ? String(saved[p.id]) : '']));
  const sum = people.reduce((acc, p) => acc + (Number(current[p.id]) || 0), 0);

  const save = useMutation({
    mutationFn: async (clear: boolean) => {
      if (!meta.data) throw new Error('Lar ainda não carregado.');
      let settings: Record<string, unknown> = {};
      try {
        settings = meta.data.settings ? JSON.parse(meta.data.settings as string) : {};
      } catch {
        settings = {};
      }
      const splitRatio = clear
        ? {}
        : Object.fromEntries(people.map((p) => [p.id, Number(current[p.id]) || 0]).filter(([, v]) => (v as number) > 0));
      return tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.households,
        rowId: meta.data.$id,
        data: { settings: JSON.stringify({ ...settings, splitRatio }) },
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['householdMeta', householdId] }),
  });

  return (
    <section className="card flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">Divisão proporcional das contas</h2>
        <p className="text-sm text-slate-500">
          Se as rendas são diferentes, combinem uma proporção (ex.: 60% / 40%). Ela vira a opção
          "Proporcional" ao lançar despesas — percepção de justiça sem calcular toda vez.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name.split(' ')[0]}</span>
            <input
              inputMode="numeric"
              className="input !min-h-[40px] w-20 text-right"
              placeholder="%"
              value={current[p.id] ?? ''}
              onChange={(e) => setValues({ ...current, [p.id]: e.target.value })}
            />
            <span className="text-sm text-slate-400">%</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-primary flex-1" disabled={sum !== 100 || save.isPending} onClick={() => save.mutate(false)}>
          Salvar proporção
        </button>
        {Object.keys(saved).length > 0 && (
          <button className="btn-secondary" disabled={save.isPending} onClick={() => save.mutate(true)}>
            Remover
          </button>
        )}
      </div>
      {sum !== 100 && sum > 0 && <p className="text-sm text-amber-600">A soma precisa dar 100% (está em {sum}%).</p>}
      {save.isSuccess && <p className="text-sm text-green-600">Salvo!</p>}
      {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
    </section>
  );
}

/**
 * Modo férias: pausa a geração de rotinas até a data escolhida e evita o
 * acúmulo de "atrasadas" (a tick pula a materialização e arquiva pendências
 * vencidas do período). Evita o efeito "quebrei a sequência, desisto".
 */
function VacationSettings() {
  const { householdId } = useActiveHousehold();
  const meta = useHouseholdMeta(householdId);
  const queryClient = useQueryClient();
  const [until, setUntil] = useState('');

  const settings: Record<string, unknown> = (() => {
    try {
      return meta.data?.settings ? JSON.parse(meta.data.settings as string) : {};
    } catch {
      return {};
    }
  })();
  const pausedUntil = typeof settings.pausedUntil === 'string' ? settings.pausedUntil : null;
  const isPaused = pausedUntil ? new Date(pausedUntil) > new Date() : false;

  const save = useMutation({
    mutationFn: async (value: string | null) => {
      if (!meta.data) throw new Error('Lar ainda não carregado.');
      const next = { ...settings, pausedUntil: value };
      return tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLES.households,
        rowId: meta.data.$id,
        data: { settings: JSON.stringify(next) },
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['householdMeta', householdId] }),
  });

  return (
    <section className="card flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">Modo férias</h2>
        <p className="text-sm text-slate-500">
          Viajando? Pause as rotinas do lar até uma data: nada de tarefa nova nem "atrasadas"
          acumulando. Na volta, tudo recomeça limpo.
        </p>
      </div>
      {isPaused ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-brand-600">
            Pausado até {new Date(pausedUntil!).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </p>
          <button className="btn-secondary !min-h-[40px]" disabled={save.isPending} onClick={() => save.mutate(null)}>
            Encerrar agora
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Pausar até"
            className="input flex-1"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
          <button
            className="btn-primary !min-h-[44px]"
            disabled={!until || save.isPending}
            onClick={() => save.mutate(new Date(`${until}T23:59:59-03:00`).toISOString())}
          >
            Pausar
          </button>
        </div>
      )}
      {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
    </section>
  );
}

function NotificationsSettings() {
  const state = usePushState();
  const enable = useEnablePush();
  const test = useTestPush();

  const needsInstall = PUSH_SUPPORTED && isIOS() && !isStandalone();
  const granted = state.data?.permission === 'granted' && state.data?.subscribed;

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="font-semibold">Notificações</h2>

      {granted && <DailySummarySettings />}

      {!PUSH_SUPPORTED ? (
        <p className="text-sm text-slate-500">
          Este navegador não suporta notificações push.
        </p>
      ) : needsInstall ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <p>Para receber notificações no iPhone/iPad, instale o app primeiro:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Toque no botão <strong>Compartilhar</strong> (□↑) do Safari;</li>
            <li>Escolha <strong>Adicionar à Tela de Início</strong>;</li>
            <li>Abra o MinhaCasinha pelo ícone instalado e volte aqui.</li>
          </ol>
        </div>
      ) : granted ? (
        <>
          <p className="text-sm text-green-600">Notificações ativadas.</p>
          <button className="btn-secondary" onClick={() => test.mutate()} disabled={test.isPending}>
            {test.isPending ? 'Enviando…' : 'Testar notificação'}
          </button>
          {test.isSuccess && <p className="text-sm text-green-600">Enviada! Deve chegar em instantes.</p>}
          {test.isError && <p className="text-sm text-red-600">{(test.error as Error).message}</p>}
        </>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Receba lembretes de eventos, tarefas do dia e contas fixas.
          </p>
          <button className="btn-primary" onClick={() => enable.mutate()} disabled={enable.isPending}>
            {enable.isPending ? 'Ativando…' : 'Ativar notificações'}
          </button>
          {enable.isError && <p className="text-sm text-red-600">{(enable.error as Error).message}</p>}
        </>
      )}
    </section>
  );
}
