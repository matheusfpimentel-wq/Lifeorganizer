/**
 * Moldura dos mini-games: overlay em tela cheia com placar, vidas, botão de
 * sair e tela de fim de jogo com o recorde do casal (tabela gameScores).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { useHouseholdPeople } from '@/features/households/hooks';
import { bestByMember, useHighScores, useSubmitScore, GAME_LABELS, type GameSlug } from '@/features/games/hooks';
import { Icon } from '@/components/icons';

export function GameShell({
  game,
  householdId,
  score,
  lives,
  maxLives,
  over,
  onRestart,
  onClose,
  children,
  hint,
}: {
  game: GameSlug;
  householdId: string | null;
  score: number;
  lives: number;
  maxLives: number;
  over: boolean;
  onRestart: () => void;
  onClose: () => void;
  children: ReactNode;
  hint: string;
}) {
  const scores = useHighScores(householdId, game);
  const submit = useSubmitScore(householdId);
  const { people } = useHouseholdPeople(householdId);
  const submittedFor = useRef<number | null>(null);

  // grava a pontuação uma única vez por partida encerrada
  useEffect(() => {
    if (over && score > 0 && submittedFor.current !== score) {
      submittedFor.current = score;
      submit.mutate({ game, score });
    }
    if (!over) submittedFor.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const best = bestByMember(scores.data ?? []);
  const record = (scores.data ?? [])[0]?.score ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 p-3 pt-[calc(env(safe-area-inset-top)+8px)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-2">
        <header className="flex items-center justify-between gap-2 text-white">
          <div>
            <h1 className="text-lg font-extrabold">{GAME_LABELS[game]}</h1>
            <p className="text-xs opacity-70">recorde do lar: {Math.max(record, score)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span aria-label={`${lives} de ${maxLives} vidas`} className="text-sm">
              {Array.from({ length: maxLives }, (_, i) => (i < lives ? '❤️' : '🖤')).join('')}
            </span>
            <span className="min-w-[3ch] text-right text-2xl font-extrabold tabular-nums">{score}</span>
            <button
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Sair do jogo"
              onClick={onClose}
            >
              <Icon.X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden rounded-3xl">
          {children}

          {over && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/80 p-4 text-center text-white">
              <p className="text-3xl font-extrabold">Fim de jogo!</p>
              <p className="text-5xl font-extrabold text-amber-300 tabular-nums">{score}</p>
              {best.size > 0 && (
                <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm">
                  <p className="mb-1 font-bold opacity-80">Placar do casal</p>
                  {people
                    .map((p) => ({ name: p.name.split(' ')[0], score: best.get(p.id) ?? 0 }))
                    .sort((a, b) => b.score - a.score)
                    .map((entry, i) => (
                      <p key={entry.name}>
                        {i === 0 && entry.score > 0 ? '👑 ' : ''}{entry.name}: <strong>{entry.score}</strong>
                      </p>
                    ))}
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn-primary" onClick={onRestart}>Jogar de novo</button>
                <button className="btn-secondary !border-white/30 !text-white" onClick={onClose}>Voltar pra vila</button>
              </div>
            </div>
          )}
        </div>

        <p className="pb-[calc(env(safe-area-inset-bottom)+4px)] text-center text-xs text-white/60">{hint}</p>
      </div>
    </div>
  );
}
