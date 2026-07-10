import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthContext';
import { isAppwriteConfigured } from '@/lib/appwrite';

type Mode = 'login' | 'register' | 'magic';

export default function LoginPage() {
  const { loginWithPassword, registerWithPassword, sendMagicLink } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      if (mode === 'login') await loginWithPassword(email, password);
      else if (mode === 'register') await registerWithPassword(name, email, password);
      else {
        await sendMagicLink(email);
        setMessage('Link de acesso enviado! Confira seu e-mail.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand-600">Morada</h1>
        <p className="mt-2 text-slate-500">Organize a vida do seu lar, juntos.</p>
      </div>

      {!isAppwriteConfigured && (
        <div className="card border border-amber-300 bg-amber-50 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Backend não configurado: preencha <code>VITE_APPWRITE_ENDPOINT</code> e{' '}
          <code>VITE_APPWRITE_PROJECT_ID</code> no <code>.env</code>.
        </div>
      )}

      <form className="card flex flex-col gap-4" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div>
            <label className="label" htmlFor="name">Nome</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        {mode !== 'magic' && (
          <div>
            <label className="label" htmlFor="password">Senha</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={busy || !isAppwriteConfigured}>
          {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar link mágico'}
        </button>
        {message && <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      </form>

      <div className="flex flex-col gap-2 text-center text-sm">
        {mode !== 'login' && (
          <button className="text-brand-600" onClick={() => setMode('login')}>Já tenho conta</button>
        )}
        {mode !== 'register' && (
          <button className="text-brand-600" onClick={() => setMode('register')}>Criar conta</button>
        )}
        {mode !== 'magic' && (
          <button className="text-brand-600" onClick={() => setMode('magic')}>Entrar com link mágico</button>
        )}
      </div>
    </div>
  );
}
