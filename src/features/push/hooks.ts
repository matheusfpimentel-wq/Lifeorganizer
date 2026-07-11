import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExecutionMethod, ID, Query } from 'appwrite';
import { DB_ID, functions, TABLES, tablesDB } from '@/lib/appwrite';
import { withPersonalPermissions } from '@/lib/permissions';
import { useAuth } from '@/features/auth/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const PUSH_SUPPORTED =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window &&
  'Notification' in window;

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(normalized);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Estado atual: permissão do browser + se há assinatura ativa no SW. */
export function usePushState() {
  return useQuery({
    queryKey: ['pushState'],
    queryFn: async () => {
      if (!PUSH_SUPPORTED) return { permission: 'unsupported' as const, subscribed: false };
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return { permission: Notification.permission, subscribed: !!sub };
    },
    staleTime: 5000,
  });
}

/** Pede permissão (após gesto do usuário), assina e persiste a subscription. */
export function useEnablePush() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!PUSH_SUPPORTED) throw new Error('Push não é suportado neste navegador.');
      if (!VAPID_PUBLIC_KEY) throw new Error('VAPID pública não configurada (VITE_VAPID_PUBLIC_KEY).');
      if (!user) throw new Error('Não autenticado');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permissão de notificação negada.');

      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        }));

      const json = sub.toJSON();
      const endpoint = json.endpoint!;
      // evita duplicar a mesma assinatura
      const existing = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLES.pushSubscriptions,
        queries: [Query.equal('userId', user.$id), Query.equal('endpoint', endpoint), Query.limit(1)],
      });
      if (existing.rows.length === 0) {
        await tablesDB.createRow({
          databaseId: DB_ID,
          tableId: TABLES.pushSubscriptions,
          rowId: ID.unique(),
          data: {
            userId: user.$id,
            endpoint,
            keys: JSON.stringify(json.keys),
            lastSeenAt: new Date().toISOString(),
          },
          permissions: withPersonalPermissions(user.$id),
        });
      }
      return true;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pushState'] }),
  });
}

/** Chama a function `api` (/push/test) autenticada pela sessão do usuário. */
export function useTestPush() {
  return useMutation({
    mutationFn: async () => {
      const exec = await functions.createExecution({
        functionId: 'api',
        body: '',
        async: false,
        xpath: '/push/test',
        method: ExecutionMethod.POST,
      });
      const parsed = exec.responseBody ? JSON.parse(exec.responseBody) : {};
      if (!parsed.ok) throw new Error(parsed.error || 'Falha ao enviar notificação de teste.');
      return parsed;
    },
  });
}
