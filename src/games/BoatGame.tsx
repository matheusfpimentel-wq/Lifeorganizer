/**
 * Corredeira (inspirado em Subway Surfers): o barquinho desce o rio em 3
 * raias; toque na esquerda/direita (ou nas setas) para desviar de pedras e
 * troncos e pegar moedas. A correnteza acelera. 3 batidas encerram.
 */
import { useEffect, useRef, useState } from 'react';
import { GameShell } from './GameShell';

const LANES = [22, 50, 78]; // x% das 3 raias
const BOAT_Y = 82; // y% do barco
const MAX_LIVES = 3;

type ObKind = 'rock' | 'log' | 'coin';
interface Obj {
  id: number;
  lane: number;
  y: number;
  kind: ObKind;
  gone: boolean;
}

export default function BoatGame({ householdId, onClose }: { householdId: string | null; onClose: () => void }) {
  const [, force] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [lane, setLane] = useState(1);
  const over = lives <= 0;

  const laneRef = useRef(1);
  const objs = useRef<Obj[]>([]);
  const nextId = useRef(1);
  const spawnY = useRef(0);
  const dist = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const invuln = useRef(0);

  function reset() {
    laneRef.current = 1;
    objs.current = [];
    spawnY.current = 0;
    dist.current = 0;
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    invuln.current = 0;
    setLane(1);
    setScore(0);
    setLives(MAX_LIVES);
  }

  function move(dir: -1 | 1) {
    if (over) return;
    laneRef.current = Math.max(0, Math.min(2, laneRef.current + dir));
    setLane(laneRef.current);
  }

  useEffect(() => {
    if (over) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;

      const speed = 42 + Math.min(dist.current / 60, 46); // acelera com a distância
      dist.current += speed * dt;
      scoreRef.current = Math.floor(dist.current / 10);
      setScore(scoreRef.current);
      if (invuln.current > 0) invuln.current -= dt;

      for (const o of objs.current) o.y += speed * dt;
      objs.current = objs.current.filter((o) => o.y < 108 && !o.gone);

      spawnY.current -= speed * dt;
      if (spawnY.current <= 0) {
        spawnY.current = 34 + Math.random() * 20;
        const lane = Math.floor(Math.random() * 3);
        const r = Math.random();
        const kind: ObKind = r < 0.28 ? 'coin' : r < 0.64 ? 'rock' : 'log';
        objs.current.push({ id: nextId.current++, lane, y: -8, kind, gone: false });
      }

      // colisões na faixa do barco
      for (const o of objs.current) {
        if (o.gone || o.lane !== laneRef.current) continue;
        if (Math.abs(o.y - BOAT_Y) < 7) {
          if (o.kind === 'coin') {
            o.gone = true;
            scoreRef.current += 5;
            setScore(scoreRef.current);
          } else if (invuln.current <= 0) {
            o.gone = true;
            invuln.current = 1.1;
            livesRef.current -= 1;
            setLives(livesRef.current);
          }
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
      game="barco"
      householdId={householdId}
      score={score}
      lives={lives}
      maxLives={MAX_LIVES}
      over={over}
      onRestart={reset}
      onClose={onClose}
      hint="Toque na esquerda/direita da tela para trocar de raia. Pegue moedas, desvie das pedras!"
    >
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-500 to-sky-700">
        {/* margens */}
        <div className="absolute inset-y-0 left-0 w-[10%] bg-emerald-600/80" />
        <div className="absolute inset-y-0 right-0 w-[10%] bg-emerald-600/80" />
        {/* correnteza (linhas que descem) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          {LANES.map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#ffffff20" strokeWidth="0.5" strokeDasharray="4 6"
              style={{ animation: 'flow 0.6s linear infinite' }} />
          ))}
          {objs.current.map((o) => {
            const x = LANES[o.lane];
            if (o.kind === 'coin') return <circle key={o.id} cx={x} cy={o.y} r="3.4" fill="#fde047" stroke="#f59e0b" strokeWidth="0.8" />;
            if (o.kind === 'rock') return <ellipse key={o.id} cx={x} cy={o.y} rx="5.5" ry="4.4" fill="#64748b" stroke="#475569" strokeWidth="0.8" />;
            return <rect key={o.id} x={x - 6.5} y={o.y - 2.6} width="13" height="5.2" rx="2.4" fill="#92400e" stroke="#78350f" strokeWidth="0.8" />;
          })}
        </svg>

        {/* barco */}
        <div
          className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-100"
          style={{ left: `${LANES[lane]}%`, top: `${BOAT_Y}%`, opacity: flicker ? 0.4 : 1 }}
        >
          <svg viewBox="-12 -14 24 28" className="h-full w-full" aria-hidden>
            <path d="M-9 4 Q0 10 9 4 L7 0 -7 0 Z" fill="#b45309" />
            <path d="M-7 0 L7 0 6 -3 -6 -3 Z" fill="#d97706" />
            <rect x="-0.6" y="-13" width="1.2" height="11" fill="#78350f" />
            <path d="M0.6 -13 L8 -4 L0.6 -4 Z" fill="#f43f5e" />
            <circle cx="0" cy="-5" r="1.4" fill="#fcd9b8" />
          </svg>
        </div>

        {/* zonas de toque */}
        <button aria-label="Ir para a esquerda" className="absolute inset-y-0 left-0 w-1/2" onPointerDown={(e) => { e.preventDefault(); move(-1); }} />
        <button aria-label="Ir para a direita" className="absolute inset-y-0 right-0 w-1/2" onPointerDown={(e) => { e.preventDefault(); move(1); }} />
      </div>
    </GameShell>
  );
}
