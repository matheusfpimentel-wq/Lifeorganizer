import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
  info: string | null;
}

/**
 * Captura exceções de render e mostra a mensagem em vez de tela branca.
 * Em produção (PWA) não há overlay do Vite, então isto é o que torna erros
 * visíveis e diagnosticáveis.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturou:', error, info);
    this.setState({ info: info.componentStack ?? null });
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-6">
        <div className="card border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <h1 className="text-lg font-bold text-red-700 dark:text-red-300">Algo deu errado nesta tela</h1>
          <p className="mt-2 break-words font-mono text-sm text-red-800 dark:text-red-200">
            {error.name}: {error.message}
          </p>
          {info && (
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
          <button className="btn-secondary mt-4" onClick={this.reset}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}
