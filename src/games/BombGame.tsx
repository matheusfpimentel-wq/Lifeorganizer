/**
 * Explosão no banco (inspirado em Bomberman): o ladrão planta bombas para
 * estourar os caixotes e escapar dos guardas. Bomba explode em cruz depois de
 * 2s. Limpe os guardas para avançar de andar. 3 vidas.
 */
import { useEffect, useRef, useState } from 'react';
import { GameShell } from './GameShell';

const COLS = 9;
const ROWS = 11;
const WALL = 1;
const CRATE = 2;
const MAX_LIVES = 3;

type Cell = 0 | 1 | 2;
interface Pos { c: number; r: number; }
interface Bomb { c: number; r: number; fuse: number; }
interface Blast { c: number; r: number; ttl: number; }
interface Enemy { c: number; r: number; dir: Pos; cool: number; }

const key = (c: number, r: number) => r * COLS + c;

function buildGrid(level: number): { grid: Cell[]; enemies: Enemy[] } {
  const grid: Cell[] = new Array(COLS * ROWS).fill(0);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 || (r % 2 === 0 && c % 2 === 0)) {
        grid[key(c, r)] = WALL;
      }
    }
  }
  // spawn do jogador (canto superior esquerdo) fica livre
  const safe = new Set([key(1, 1), key(2, 1), key(1, 2)]);
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (grid[key(c, r)] === 0 && !safe.has(key(c, r)) && Math.random() < 0.62) grid[key(c, r)] = CRATE;
    }
  }
  // guardas em cantos distantes, em piso livre
  const enemies: Enemy[] = [];
  const spots: Pos[] = [
    { c: COLS - 2, r: ROWS - 2 }, { c: COLS - 2, r: 1 }, { c: 1, r: ROWS - 2 },
    { c: COLS - 2, r: Math.floor(ROWS / 2) }, { c: Math.floor(COLS / 2), r: ROWS - 2 },
  ];
  const count = Math.min(2 + level, spots.length);
  for (let i = 0; i < count; i++) {
    const p = spots[i];
    grid[key(p.c, p.r)] = 0;
    enemies.push({ c: p.c, r: p.r, dir: { c: 0, r: 0 }, cool: 0 });
  }
  return { grid, enemies };
}

export default function BombGame({ householdId, onClose }: { householdId: string | null; onClose: () => void }) {
  const [, force] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const over = lives <= 0;

  const grid = useRef<Cell[]>([]);
  const player = useRef<Pos>({ c: 1, r: 1 });
  const bombs = useRef<Bomb[]>([]);
  const blasts = useRef<Blast[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const levelRef = useRef(1);
  const invuln = useRef(0);
  const enemyStep = useRef(0);

  function loadLevel(lvl: number) {
    const built = buildGrid(lvl);
    grid.current = built.grid;
    enemies.current = built.enemies;
    bombs.current = [];
    blasts.current = [];
    player.current = { c: 1, r: 1 };
    invuln.current = 0;
  }

  function reset() {
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    levelRef.current = 1;
    setScore(0);
    setLives(MAX_LIVES);
    setLevel(1);
    loadLevel(1);
  }

  // primeira carga
  const inited = useRef(false);
  if (!inited.current) {
    inited.current = true;
    loadLevel(1);
  }

  const passable = (c: number, r: number) =>
    grid.current[key(c, r)] === 0 && !bombs.current.some((b) => b.c === c && b.r === r);

  function movePlayer(dc: number, dr: number) {
    if (over) return;
    const nc = player.current.c + dc;
    const nr = player.current.r + dr;
    if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) return;
    if (passable(nc, nr)) player.current = { c: nc, r: nr };
    force((n) => n + 1);
  }

  function dropBomb() {
    if (over) return;
    const { c, r } = player.current;
    if (bombs.current.some((b) => b.c === c && b.r === r)) return;
    if (bombs.current.length >= 2) return;
    bombs.current.push({ c, r, fuse: 2 });
    force((n) => n + 1);
  }

  function explode(bomb: Bomb) {
    const cells: Blast[] = [{ c: bomb.c, r: bomb.r, ttl: 0.5 }];
    const radius = 1 + Math.floor(levelRef.current / 2);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let i = 1; i <= radius; i++) {
        const c = bomb.c + dc * i;
        const r = bomb.r + dr * i;
        const cell = grid.current[key(c, r)];
        if (cell === WALL) break;
        cells.push({ c, r, ttl: 0.5 });
        if (cell === CRATE) {
          grid.current[key(c, r)] = 0;
          scoreRef.current += 10;
          break;
        }
      }
    }
    setScore(scoreRef.current);
    blasts.current.push(...cells);
  }

  useEffect(() => {
    if (over) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (invuln.current > 0) invuln.current -= dt;

      // bombas
      for (const b of bombs.current) b.fuse -= dt;
      const exploded = bombs.current.filter((b) => b.fuse <= 0);
      for (const b of exploded) explode(b);
      bombs.current = bombs.current.filter((b) => b.fuse > 0);

      // clarões somem
      for (const bl of blasts.current) bl.ttl -= dt;
      const activeBlasts = blasts.current.filter((bl) => bl.ttl > 0);
      blasts.current = activeBlasts;

      // guardas se movem em passos
      enemyStep.current -= dt;
      if (enemyStep.current <= 0) {
        enemyStep.current = Math.max(0.5 - levelRef.current * 0.03, 0.26);
        for (const e of enemies.current) {
          const options: Pos[] = [];
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            if (passable(e.c + dc, e.r + dr)) options.push({ c: dc, r: dr });
          }
          if (options.length === 0) continue;
          // tende a seguir reto
          const straight = options.find((o) => o.c === e.dir.c && o.r === e.dir.r);
          const pick = straight && Math.random() < 0.7 ? straight : options[Math.floor(Math.random() * options.length)];
          e.dir = pick;
          e.c += pick.c;
          e.r += pick.r;
        }
      }

      // guarda pega o jogador
      const hitByEnemy = enemies.current.some((e) => e.c === player.current.c && e.r === player.current.r);
      // clarão atinge guardas
      const before = enemies.current.length;
      enemies.current = enemies.current.filter(
        (e) => !activeBlasts.some((bl) => bl.c === e.c && bl.r === e.r),
      );
      if (enemies.current.length < before) {
        scoreRef.current += 50 * (before - enemies.current.length);
        setScore(scoreRef.current);
      }
      // clarão atinge jogador
      const inBlast = activeBlasts.some((bl) => bl.c === player.current.c && bl.r === player.current.r);
      if ((hitByEnemy || inBlast) && invuln.current <= 0) {
        invuln.current = 1.4;
        livesRef.current -= 1;
        setLives(livesRef.current);
        player.current = { c: 1, r: 1 };
      }

      // andar limpo -> próximo nível
      if (enemies.current.length === 0 && blasts.current.length === 0) {
        scoreRef.current += 100;
        setScore(scoreRef.current);
        levelRef.current += 1;
        setLevel(levelRef.current);
        loadLevel(levelRef.current);
      }

      force((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [over]);

  const flicker = invuln.current > 0 && Math.floor(invuln.current * 10) % 2 === 0;
  const blastSet = new Set(blasts.current.map((b) => key(b.c, b.r)));

  return (
    <GameShell
      game="ladrao"
      householdId={householdId}
      score={score}
      lives={lives}
      maxLives={MAX_LIVES}
      over={over}
      onRestart={reset}
      onClose={onClose}
      hint={`Andar ${level} · setas para mover, 💣 para plantar bomba. Estoure os guardas e os caixotes!`}
    >
      <div className="absolute inset-0 flex flex-col bg-slate-800">
        {/* tabuleiro */}
        <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
          <svg viewBox={`0 0 ${COLS} ${ROWS}`} className="h-full max-h-full w-auto max-w-full" aria-hidden>
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const cell = grid.current[key(c, r)];
                const blasting = blastSet.has(key(c, r));
                return (
                  <g key={`${c}-${r}`}>
                    <rect x={c} y={r} width="1" height="1" fill={(c + r) % 2 ? '#14532d' : '#166534'} />
                    {cell === WALL && <rect x={c + 0.05} y={r + 0.05} width="0.9" height="0.9" rx="0.12" fill="#475569" stroke="#334155" strokeWidth="0.05" />}
                    {cell === CRATE && <rect x={c + 0.1} y={r + 0.1} width="0.8" height="0.8" rx="0.1" fill="#b45309" stroke="#78350f" strokeWidth="0.06" />}
                    {blasting && <rect x={c} y={r} width="1" height="1" fill="#fb923c" opacity="0.75" />}
                  </g>
                );
              }),
            )}
            {/* bombas */}
            {bombs.current.map((b, i) => (
              <g key={`b${i}`}>
                <circle cx={b.c + 0.5} cy={b.r + 0.55} r={0.34 + (b.fuse < 0.6 ? 0.06 * (Math.floor(b.fuse * 10) % 2) : 0)} fill="#0f172a" />
                <path d={`M${b.c + 0.5} ${b.r + 0.2} q0.2 -0.15 0.3 0`} stroke="#f59e0b" strokeWidth="0.08" fill="none" />
              </g>
            ))}
            {/* guardas */}
            {enemies.current.map((e, i) => (
              <g key={`e${i}`} transform={`translate(${e.c + 0.5} ${e.r + 0.5})`}>
                <circle r="0.36" fill="#1d4ed8" />
                <rect x="-0.2" y="-0.42" width="0.4" height="0.18" rx="0.08" fill="#1e3a8a" />
                <circle cx="-0.13" cy="-0.02" r="0.06" fill="#fff" />
                <circle cx="0.13" cy="-0.02" r="0.06" fill="#fff" />
              </g>
            ))}
            {/* ladrão (jogador) */}
            <g transform={`translate(${player.current.c + 0.5} ${player.current.r + 0.5})`} opacity={flicker ? 0.4 : 1}>
              <circle r="0.38" fill="#334155" />
              <rect x="-0.34" y="-0.16" width="0.68" height="0.2" fill="#0f172a" />
              <circle cx="-0.12" cy="-0.06" r="0.06" fill="#fff" />
              <circle cx="0.12" cy="-0.06" r="0.06" fill="#fff" />
              <circle cx="0.28" cy="-0.24" r="0.12" fill="#fde047" />
            </g>
          </svg>
        </div>

        {/* controles */}
        <div className="flex items-center justify-between px-4 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-1">
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            <span />
            <Ctrl label="↑" onPress={() => movePlayer(0, -1)} />
            <span />
            <Ctrl label="←" onPress={() => movePlayer(-1, 0)} />
            <span />
            <Ctrl label="→" onPress={() => movePlayer(1, 0)} />
            <span />
            <Ctrl label="↓" onPress={() => movePlayer(0, 1)} />
            <span />
          </div>
          <button
            className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-3xl shadow-lg active:scale-90"
            aria-label="Plantar bomba"
            onPointerDown={(e) => { e.preventDefault(); dropBomb(); }}
          >
            💣
          </button>
        </div>
      </div>
    </GameShell>
  );
}

function Ctrl({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl font-bold text-white active:bg-white/30"
      aria-label={`Mover ${label}`}
      onPointerDown={(e) => { e.preventDefault(); onPress(); }}
    >
      {label}
    </button>
  );
}
