/**
 * Sessão do usuário. Login por email/senha e Magic URL prontos —
 * o método habilitado no projeto é decidido na configuração (seção 9).
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ID, type Models } from 'appwrite';
import { account, isAppwriteConfigured } from '@/lib/appwrite';

interface AuthContextValue {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (name: string, email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAppwriteConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await account.get());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // conclui login via Magic URL (?userId=...&secret=...)
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');
    if (userId && secret) {
      account
        .createSession({ userId, secret })
        .then(() => {
          window.history.replaceState({}, '', window.location.pathname);
        })
        .finally(refresh);
    } else {
      void refresh();
    }
  }, [refresh]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      await account.createEmailPasswordSession({ email, password });
      await refresh();
    },
    [refresh],
  );

  const registerWithPassword = useCallback(
    async (name: string, email: string, password: string) => {
      await account.create({ userId: ID.unique(), email, password, name });
      await account.createEmailPasswordSession({ email, password });
      await refresh();
    },
    [refresh],
  );

  const sendMagicLink = useCallback(async (email: string) => {
    await account.createMagicURLToken({
      userId: ID.unique(),
      email,
      url: `${window.location.origin}/`,
    });
  }, []);

  const logout = useCallback(async () => {
    await account.deleteSession({ sessionId: 'current' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithPassword, registerWithPassword, sendMagicLink, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth fora do AuthProvider');
  return context;
}
