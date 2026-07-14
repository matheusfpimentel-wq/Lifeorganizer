/**
 * Pescaria: espere a bóia afundar e PUXE na hora certa. Puxar cedo arrebenta
 * a linha; deixar passar, o peixe escapa. Peixes raros valem mais e a janela
 * de fisgada encurta a cada captura. (G1 do plano de mini-games.)
 */
import { useEffect, useRef, useState } from 'react';
import { GameShell } from './GameShell';

type Phase = 'waiting' | 'bite' | 'caught' | 'lost';

interface Catch {
  emoji: string;
  label: string;
  points: number;
}

const MAX_LIVES = 3;

const CATCHES: Array<Catch & { chance: number }> = [
  { emoji: '🐟', label: 'Lambari', points: 1, chance: 0.52 },
  { emoji: '🐠', label: 'Peixe listrado', points: 2, chance: 0.22 },
  { emoji: '🐡', label: 'Baiacu bravo', points: 3, chance: 0.1 },
  { emoji: '🌟', label: 'Dourado lendário', points: 5, chance: 0.08 },
  { emoji: '🥾', label: 'Bota velha…', points: 0, chance: 0.05 },
  { emoji: '💎', label: 'TESOURO!', points: 10, chance: 0.03 },
];

function rollCatch(): Catch {
  let roll = Math.random();
  for (const option of CATCHES) {
    if (roll < option.chance) return option;
    roll -= option.chance;
  }
  return CATCHES[0];
}

export default function FishingGame({ householdId, onClose }: { householdId: string | null; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [message, setMessage] = useState('Espere a bóia afundar…');
  const [lastCatch, setLastCatch] = useState<Catch | null>(null);
  const [catches, setCatches] = useState(0);

  const timers = useRef<number[]>([]);
  const phaseRef = useRef<Phase>('waiting');
  const over = lives <= 0;

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function setPhaseSafe(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function scheduleBite() {
    clearTimers();
    setPhaseSafe('waiting');
    setMessage('Espere a bóia afundar…');
    const delay = 1200 + Math.random() * 3200;
    timers.current.push(
      window.setTimeout(() => {
        setPhaseSafe('bite');
        setMessage('PUXA AGORA!');
        // janela encurta conforme você pesca (900ms → 450ms)
        const windowMs = Math.max(900 - catches * 45, 450);
        timers.current.push(
          window.setTimeout(() => {
            if (phaseRef.current === 'bite') {
              setPhaseSafe('lost');
              setLastCatch(null);
              setMessage('Escapou! 🫧');
              setLives((l) => l - 1);
              timers.current.push(window.setTimeout(scheduleBite, 1100));
            }
          }, windowMs),
        );
      }, delay),
    );
  }

  // começa (e recomeça) a pesca
  useEffect(() => {
    if (!over) scheduleBite();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  function restart() {
    clearTimers();
    setScore(0);
    setLives(MAX_LIVES);
    setCatches(0);
    setLastCatch(null);
    scheduleBite();
  }

  function pull() {
    if (over) return;
    if (phaseRef.current === 'waiting') {
      clearTimers();
      setPhaseSafe('lost');
      setLastCatch(null);
      setMessage('Cedo demais — a linha arrebentou! 😵');
      setLives((l) => l - 1);
      timers.current.push(window.setTimeout(scheduleBite, 1100));
      return;
    }
    if (phaseRef.current === 'bite') {
      clearTimers();
      const result = rollCatch();
      setPhaseSafe('caught');
      setLastCatch(result);
      setCatches((c) => c + 1);
      setScore((s) => s + result.points);
      setMessage(result.points > 0 ? `${result.label} +${result.points}!` : `${result.label} (nada…)`);
      timers.current.push(window.setTimeout(scheduleBite, 1300));
    }
  }

  return (
    <GameShell
      game="pescaria"
      householdId={householdId}
      score={score}
      lives={lives}
      maxLives={MAX_LIVES}
      over={over}
      onRestart={restart}
      onClose={onClose}
      hint="Toque em QUALQUER lugar para puxar — mas só quando a bóia afundar!"
    >
      <button
        type="button"
        className="absolute inset-0 block w-full select-none"
        aria-label="Puxar a vara"
        onPointerDown={(e) => {
          e.preventDefault();
          pull();
        }}
      >
        {/* cenário: entardecer no rio */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-200 via-amber-100 to-sky-300" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-sky-400 to-sky-600" />
        <div className="absolute left-[10%] top-[12%] h-10 w-10 rounded-full bg-amber-300" />

        {/* doca e pescador (o casal está pescando) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
          <rect x="2" y="50" width="30" height="4" rx="1.6" fill="#92400e" />
          <path d="M6 54 v10 M26 54 v10" stroke="#78350f" strokeWidth="2" />
          <g transform="translate(22 46)">
            <circle cx="0" cy="-7" r="3.4" fill="#fcd9b8" />
            <path d="M-3.4 -8.4 a3.4 3.4 0 0 1 6.8 0 l-0.8 -1.2 h-5.2 Z" fill="#065f46" />
            <path d="M-3 -3.4 h6 l-1 7.4 h-4 Z" fill="#ea580c" />
            <path
              d={phase === 'bite' ? 'M2.6 -4 L26 6' : 'M2.6 -4 L24 -14'}
              stroke="#78350f"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={phase === 'bite' ? 'M26 6 L30 22' : 'M24 -14 L28 18'}
              stroke="#e2e8f0"
              strokeWidth="0.7"
              fill="none"
            />
          </g>

          {/* bóia: normal ou afundando */}
          <g transform={`translate(50 ${phase === 'bite' ? 68 : 64})`}>
            <circle cx="0" cy="0" r={phase === 'bite' ? 2.2 : 3} fill={phase === 'bite' ? '#b91c1c' : '#ef4444'} />
            <circle cx="0" cy="-1.6" r="1.2" fill="#fff" opacity={phase === 'bite' ? 0.4 : 1} />
            {phase === 'bite' && (
              <>
                <circle cx="0" cy="1" r="5" fill="none" stroke="#e0f2fe" strokeWidth="0.7" opacity="0.9" />
                <circle cx="0" cy="1" r="8" fill="none" stroke="#e0f2fe" strokeWidth="0.5" opacity="0.6" />
              </>
            )}
          </g>

          {/* ondinhas */}
          <path d="M8 74 q4 -2 8 0 M30 82 q4 -2 8 0 M62 78 q4 -2 8 0 M80 70 q4 -2 8 0" stroke="#bae6fd" strokeWidth="0.8" fill="none" opacity="0.7" />
        </svg>

        {/* mensagem central */}
        <p
          className={`absolute left-1/2 top-[24%] -translate-x-1/2 whitespace-nowrap text-center font-extrabold drop-shadow-md ${
            phase === 'bite' ? 'animate-bounce text-3xl text-rose-600' : 'text-lg text-slate-700'
          }`}
        >
          {message}
        </p>

        {/* peixe fisgado */}
        {phase === 'caught' && lastCatch && (
          <p className="absolute left-1/2 top-[42%] -translate-x-1/2 text-6xl motion-safe:animate-pop">{lastCatch.emoji}</p>
        )}
      </button>
    </GameShell>
  );
}
