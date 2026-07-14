/**
 * Peixe voador (inspirado em Flappy Bird): o peixinho do lago afunda por
 * gravidade; toque para dar um impulso pra cima e passe pelas frestas entre
 * os juncos. Um toque = fim. Cada fresta vale 1 ponto.
 */
import { useEffect, useRef, useState } from 'react';
import { GameShell } from './GameShell';

// coordenadas em % da área de jogo (0–100)
const FISH_X = 26;
const GRAVITY = 90; // %/s²
const FLAP = -34; // impulso (%/s)
const GAP = 30; // altura da fresta (%)
const PIPE_W = 13;
const SPEED = 30; // %/s

interface Pipe {
  id: number;
  x: number;
  gapY: number; // centro da fresta
  passed: boolean;
}

export default function FishFlappyGame({ householdId, onClose }: { householdId: string | null; onClose: () => void }) {
  const [, force] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);

  const y = useRef(50);
  const vy = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const nextId = useRef(1);
  const spawnX = useRef(100);
  const scoreRef = useRef(0);
  const rot = useRef(0);

  function reset() {
    y.current = 50;
    vy.current = 0;
    pipes.current = [];
    spawnX.current = 100;
    scoreRef.current = 0;
    rot.current = 0;
    setScore(0);
    setOver(false);
    setStarted(false);
  }

  function flap() {
    if (over) return;
    if (!started) setStarted(true);
    vy.current = FLAP;
  }

  useEffect(() => {
    if (over || !started) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;

      vy.current += GRAVITY * dt;
      y.current += vy.current * dt;
      rot.current = Math.max(-24, Math.min(60, vy.current * 1.4));

      // move e cria juncos
      for (const p of pipes.current) p.x -= SPEED * dt;
      pipes.current = pipes.current.filter((p) => p.x > -PIPE_W - 2);
      spawnX.current -= SPEED * dt;
      if (spawnX.current <= 52) {
        spawnX.current = 100;
        pipes.current.push({ id: nextId.current++, x: 100, gapY: 24 + Math.random() * 52, passed: false });
      }

      // pontua ao passar
      for (const p of pipes.current) {
        if (!p.passed && p.x + PIPE_W < FISH_X) {
          p.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      }

      // colisões: teto/chão ou junco
      const fishR = 4;
      let dead = y.current <= fishR || y.current >= 100 - fishR;
      for (const p of pipes.current) {
        if (FISH_X + fishR > p.x && FISH_X - fishR < p.x + PIPE_W) {
          if (y.current - fishR < p.gapY - GAP / 2 || y.current + fishR > p.gapY + GAP / 2) dead = true;
        }
      }
      if (dead) {
        setOver(true);
        return;
      }
      force((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [over, started]);

  return (
    <GameShell
      game="peixe"
      householdId={householdId}
      score={score}
      lives={over ? 0 : 1}
      maxLives={1}
      over={over}
      onRestart={reset}
      onClose={onClose}
      hint="Toque para o peixe subir. Passe pelas frestas entre os juncos!"
    >
      <button
        type="button"
        aria-label="Nadar para cima"
        className="absolute inset-0 block w-full select-none bg-gradient-to-b from-sky-400 to-sky-700"
        onPointerDown={(e) => { e.preventDefault(); flap(); }}
      >
        {/* bolhas de fundo */}
        <div className="absolute left-[20%] top-[30%] h-2 w-2 rounded-full bg-white/30" />
        <div className="absolute left-[70%] top-[55%] h-3 w-3 rounded-full bg-white/20" />
        <div className="absolute inset-x-0 bottom-0 h-[6%] bg-amber-200/70" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          {pipes.current.map((p) => (
            <g key={p.id}>
              <rect x={p.x} y={0} width={PIPE_W} height={p.gapY - GAP / 2} fill="#15803d" />
              <rect x={p.x} y={p.gapY + GAP / 2} width={PIPE_W} height={100 - (p.gapY + GAP / 2)} fill="#15803d" />
              <rect x={p.x - 0.6} y={p.gapY - GAP / 2 - 2.5} width={PIPE_W + 1.2} height={2.5} fill="#166534" />
              <rect x={p.x - 0.6} y={p.gapY + GAP / 2} width={PIPE_W + 1.2} height={2.5} fill="#166534" />
            </g>
          ))}
        </svg>

        {/* peixe (mantém proporção fora do preserveAspectRatio="none") */}
        <div
          className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${FISH_X}%`, top: `${y.current}%`, transform: `translate(-50%,-50%) rotate(${rot.current}deg)` }}
        >
          <svg viewBox="-12 -10 24 20" className="h-full w-full" aria-hidden>
            <ellipse cx="0" cy="0" rx="7" ry="5" fill="#fb923c" />
            <path d="M-6 0 l-5 -4 v8 Z" fill="#f97316" />
            <path d="M2 -5 q3 -3 5 -1 q-1 3 -4 3 Z" fill="#f97316" />
            <circle cx="4" cy="-1.5" r="1.3" fill="#fff" />
            <circle cx="4.4" cy="-1.5" r="0.7" fill="#0f172a" />
            <path d="M5.5 2 q2 1 3.5 0" stroke="#c2410c" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {!started && !over && (
          <p className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center text-lg font-extrabold text-white drop-shadow">
            Toque para começar
          </p>
        )}
      </button>
    </GameShell>
  );
}
