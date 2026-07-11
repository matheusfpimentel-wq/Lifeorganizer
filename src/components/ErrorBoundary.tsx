import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
  info: string | null;
  reloading: boolean;
}

/**
 * Erro típico de app aberto durante um deploy: o HTML antigo tenta baixar um
 * chunk (React.lazy) cujo hash não existe mais no servidor. A mensagem varia
 * por navegador (Safari/Chrome/Firefox).
 */
const STALE_CHUNK_RE =
  /(importing a module script failed|failed to fetch dynamically imported module|error loading dynamically imported module|chunkloaderror)/i;

const RELOAD_FLAG = 'minhacasinha:chunkReloadAt';

function isStaleChunkError(error: Error) {
  return STALE_CHUNK_RE.test(`${error.name} ${error.message}`);
}

/**
 * Captura exceções de render e mostra a mensagem em vez de tela branca.
 * Em produção (PWA) não há overlay do Vite, então isto é o que torna erros
 * visíveis e diagnosticáveis. Erros de chunk desatualizado (nova versão
 * publicada com o app aberto) disparam um reload automático único.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, reloading: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturou:', error, info);

    if (isStaleChunkError(error)) {
      const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
      if (Date.now() - last > 60_000) {
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        this.setState({ reloading: true });
        window.location.reload();
        return;
      }
    }

    this.setState({ info: info.componentStack ?? null });
  }

  reset = () => this.setState({ error: null, info: null, reloading: false });

  render() {
    const { error, info, reloading } = this.state;
    if (!error) return this.props.children;

    if (reloading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="card animate-pulse text-center">
            <h1 className="text-lg font-bold">Nova versão disponível</h1>
            <p className="mt-1 text-sm text-slate-500">Atualizando o app…</p>
          </div>
        </div>
      );
    }

    const stale = isStaleChunkError(error);

    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-6">
        <div className="card border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <h1 className="text-lg font-bold text-red-700 dark:text-red-300">
            {stale ? 'O app foi atualizado' : 'Algo deu errado nesta tela'}
          </h1>
          {stale ? (
            <p className="mt-2 text-sm text-red-800 dark:text-red-200">
              Uma nova versão foi publicada enquanto esta tela estava aberta. Recarregue para continuar.
            </p>
          ) : (
            <p className="mt-2 break-words font-mono text-sm text-red-800 dark:text-red-200">
              {error.name}: {error.message}
            </p>
          )}
          {info && !stale && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-red-700 dark:text-red-300">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-red-700/80 dark:text-red-300/80">
                {error.stack}
                {info}
              </pre>
            </details>
          )}
          <div className="mt-4 flex gap-2">
            {stale ? (
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Recarregar agora
              </button>
            ) : (
              <button className="btn-secondary" onClick={this.reset}>
                Tentar novamente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
