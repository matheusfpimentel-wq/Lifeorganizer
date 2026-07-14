/**
 * Fuga alienígena (clicando no UFO): arraste para correr pela vila enquanto
 * a nave persegue você. Desvie das bombas de raio e das colunas de abdução
 * (que piscam antes de disparar). Sobreviva o máximo que puder. 3 acertos.
 */
import { useEffect, useRef, useState } from 'react';
import { GameShell } from './GameShell';

const PLAYER_Y = 84;
const MAX_LIVES = 3;

interface Bomb { id: number; x: number; y: number; vy: number; }
interface Beam { id: number; x: number; charge: number; } // charge: tempo até disparar

export default function AlienEscapeGame({ householdId, onClose }: { householdId: string | null; onClose: () => void }) {
  const [, force] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const over = lives <= 0;

  const areaRef = useRef<HTMLDivElement>(null);
  const px = useRef(50);
  const ufoX = useRef(50);
  const bombs = useRef<Bomb[]>([]);
  const beams = useRef<Beam[]>([]);
  const nextId = useRef(1);
  const t = useRef(0);
  const bombTimer = useRef(1);
  const beamTimer = useRef(2.5);
  const livesRef = useRef(MAX_LIVES);
  const invuln = useRef(0);

  function reset() {
    px.current = 50;
    ufoX.current = 50;
    bombs.current = [];
    beams.current = [];
    t.current = 0;
    bombTimer.current = 1;
    beamTimer.current = 2.5;
    livesRef.current = MAX_LIVES;
    invuln.current = 0;
    setScore(0);
    setLives(MAX_LIVES);
  }

  function moveTo(clientX: number) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    px.current = Math.max(6, Math.min(94, ((clientX - rect.left) / rect.width) * 100));
  }

  useEffect(() => {
    if (over) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      t.current += dt;
      setScore(Math.floor(t.current));
      if (invuln.current > 0) invuln.current -= dt;

      // a nave persegue de leve
      ufoX.current += (px.current - ufoX.current) * Math.min(dt * 1.1, 1);

      // dificuldade sobe com o tempo
      const level = Math.min(t.current / 15, 3);

      // bombas
      bombTimer.current -= dt;
      if (bombTimer.current <= 0) {
        bombTimer.current = Math.max(0.9 - level * 0.18, 0.35);
        bombs.current.push({ id: nextId.current++, x: ufoX.current + (Math.random() * 16 - 8), y: 20, vy: 34 + level * 10 });
      }
      for (const b of bombs.current) b.y += b.vy * dt;
      bombs.current = bombs.current.filter((b) => b.y < 104);

      // colunas de abdução (piscam e disparam)
      beamTimer.current -= dt;
      if (beamTimer.current <= 0) {
        beamTimer.current = Math.max(3 - level * 0.4, 1.4);
        beams.current.push({ id: nextId.current++, x: px.current, charge: 0.9 });
      }
      for (const bm of beams.current) bm.charge -= dt;
      beams.current = beams.current.filter((bm) => bm.charge > -0.45);

      // colisões
      if (invuln.current <= 0) {
        let hit = false;
        for (const b of bombs.current) {
          if (Math.abs(b.x - px.current) < 6 && Math.abs(b.y - PLAYER_Y) < 7) hit = true;
        }
        for (const bm of beams.current) {
          if (bm.charge <= 0 && Math.abs(bm.x - px.current) < 7) hit = true; // disparando
        }
        if (hit) {
          invuln.current = 1.1;
          livesRef.current -= 1;
          setLives(livesRef.current);
        }
      }
      force((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [over]);

  const flicker = invuln.current > 0 && Math.floor(invuln.current * 10) % 2 === 0;

  return (
    <GameShell
      game="nave"
      householdId={householdId}
      score={score}
      lives={lives}
      maxLives={MAX_LIVES}
      over={over}
      onRestart={reset}
      onClose={onClose}
      hint="Arraste para correr. Desvie das bombas e saia das colunas de luz antes de dispararem!"
    >
      <div
        ref={areaRef}
        className="absolute inset-0 touch-none select-none overflow-hidden bg-gradient-to-b from-indigo-950 to-slate-900"
        onPointerMove={(e) => { e.preventDefault(); moveTo(e.clientX); }}
        onPointerDown={(e) => { e.preventDefault(); moveTo(e.clientX); }}
      >
        {/* estrelas + chão */}
        <div className="absolute left-[15%] top-[20%] h-1 w-1 rounded-full bg-white/70" />
        <div className="absolute left-[60%] top-[12%] h-1 w-1 rounded-full bg-white/60" />
        <div className="absolute left-[80%] top-[30%] h-1 w-1 rounded-full bg-white/50" />
        <div className="absolute inset-x-0 bottom-0 h-[10%] bg-emerald-900" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          {/* colunas de abdução */}
          {beams.current.map((bm) => (
            <rect
              key={bm.id}
              x={bm.x - 7}
              width="14"
              y="16"
              height="84"
              fill={bm.charge <= 0 ? '#a5f3fc' : '#22d3ee'}
              opacity={bm.charge <= 0 ? 0.55 : 0.18 + (bm.charge < 0.4 ? 0.25 : 0) * (Math.floor(bm.charge * 12) % 2)}
            />
          ))}
          {/* bombas de raio */}
          {bombs.current.map((b) => (
            <g key={b.id}>
              <circle cx={b.x} cy={b.y} r="3" fill="#f43f5e" />
              <circle cx={b.x} cy={b.y} r="1.4" fill="#fecaca" />
            </g>
          ))}
        </svg>

        {/* UFO */}
        <div className="absolute h-10 w-16 -translate-x-1/2" style={{ left: `${ufoX.current}%`, top: '9%' }}>
          <svg viewBox="-20 -12 40 24" className="h-full w-full" aria-hidden>
            <ellipse cx="0" cy="2" rx="18" ry="5" fill="#64748b" />
            <ellipse cx="0" cy="0" rx="9" ry="7" fill="#94a3b8" />
            <ellipse cx="0" cy="-1" rx="6" ry="4.5" fill="#a5f3fc" />
            <circle cx="-9" cy="3" r="1.4" className="fill-amber-300 motion-safe:animate-pulse" />
            <circle cx="0" cy="4" r="1.4" className="fill-rose-400 motion-safe:animate-pulse" />
            <circle cx="9" cy="3" r="1.4" className="fill-emerald-300 motion-safe:animate-pulse" />
          </svg>
        </div>

        {/* jogador */}
        <div
          className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${px.current}%`, top: `${PLAYER_Y}%`, opacity: flicker ? 0.4 : 1 }}
        >
          <svg viewBox="-8 -12 16 24" className="h-full w-full" aria-hidden>
            <rect x="-3.4" y="-2" width="6.8" height="9" rx="2.6" fill="#0ea5e9" />
            <path d="M-1.6 6.6 l-1 5 M1.6 6.6 l1 5" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="0" cy="-5.5" r="3.6" fill="#fcd9b8" />
            <path d="M-3.6 -6.4 a3.6 3.6 0 0 1 7.2 0 l-1 -1.8 h-5.2 Z" fill="#78350f" />
          </svg>
        </div>
      </div>
    </GameShell>
  );
}
