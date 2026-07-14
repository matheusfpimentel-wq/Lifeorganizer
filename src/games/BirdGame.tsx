/**
 * Acerta o pássaro: pássaros cruzam o céu cada vez mais rápido; toque neles
 * antes que escapem. 3 escapadas encerram a partida. Sequências sem errar
 * valem bônus. (G1 do plano de mini-games.)
 */
import { useEffect, useRef, useState } from 'react';
import { GameShell } from './GameShell';

interface Bird {
  id: number;
  x: number; // % da largura
  y: number; // % da altura (linha base do voo)
  speed: number; // % por segundo
  wobble: number; // fase da ondulação
  hit: boolean; // virou "puf" (some em seguida)
  hitAt: number;
}

const MAX_LIVES = 3;

export default function BirdGame({ householdId, onClose }: { householdId: string | null; onClose: () => void }) {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [combo, setCombo] = useState(0);
  const [bonusFlash, setBonusFlash] = useState(false);

  const nextId = useRef(1);
  const spawnAt = useRef(0);
  const stats = useRef({ score: 0, lives: MAX_LIVES, combo: 0 });
  const over = lives <= 0;

  function restart() {
    stats.current = { score: 0, lives: MAX_LIVES, combo: 0 };
    setBirds([]);
    setScore(0);
    setLives(MAX_LIVES);
    setCombo(0);
    spawnAt.current = 0;
  }

  // loop principal (rAF): move, cria e remove pássaros
  useEffect(() => {
    if (over) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      setBirds((prev) => {
        let next = prev.map((b) => (b.hit ? b : { ...b, x: b.x + b.speed * dt, wobble: b.wobble + dt * 6 }));

        // escapou pela direita: perde vida
        const escaped = next.filter((b) => !b.hit && b.x > 108);
        if (escaped.length > 0) {
          stats.current.lives = Math.max(0, stats.current.lives - escaped.length);
          stats.current.combo = 0;
          setLives(stats.current.lives);
          setCombo(0);
        }
        next = next.filter((b) => (b.hit ? now - b.hitAt < 450 : b.x <= 108));

        // dificuldade sobe com a pontuação
        const level = Math.min(stats.current.score / 8, 4);
        const interval = Math.max(1500 - level * 260, 620);
        if (now >= spawnAt.current && next.filter((b) => !b.hit).length < 4) {
          spawnAt.current = now + interval * (0.7 + Math.random() * 0.6);
          next = [
            ...next,
            {
              id: nextId.current++,
              x: -8,
              y: 12 + Math.random() * 58,
              speed: 22 + level * 10 + Math.random() * 10,
              wobble: Math.random() * 6,
              hit: false,
              hitAt: 0,
            },
          ];
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [over]);

  function hitBird(id: number) {
    setBirds((prev) => {
      const bird = prev.find((b) => b.id === id && !b.hit);
      if (!bird) return prev;
      stats.current.combo += 1;
      const bonus = stats.current.combo > 0 && stats.current.combo % 3 === 0 ? 2 : 1;
      stats.current.score += bonus;
      setScore(stats.current.score);
      setCombo(stats.current.combo);
      if (bonus > 1) {
        setBonusFlash(true);
        setTimeout(() => setBonusFlash(false), 600);
      }
      return prev.map((b) => (b.id === id ? { ...b, hit: true, hitAt: performance.now() } : b));
    });
  }

  return (
    <GameShell
      game="passaros"
      householdId={householdId}
      score={score}
      lives={lives}
      maxLives={MAX_LIVES}
      over={over}
      onRestart={restart}
      onClose={onClose}
      hint="Toque nos pássaros antes que atravessem o céu. A cada 3 seguidos, ponto em dobro!"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200">
        {/* nuvens de fundo */}
        <div className="absolute left-[8%] top-[16%] h-6 w-20 rounded-full bg-white/70" />
        <div className="absolute right-[12%] top-[34%] h-5 w-16 rounded-full bg-white/60" />
        <div className="absolute left-[30%] top-[58%] h-5 w-14 rounded-full bg-white/50" />
        <div className="absolute inset-x-0 bottom-0 h-[12%] rounded-t-[40%] bg-emerald-400/80" />

        {combo >= 2 && (
          <p className="absolute left-1/2 top-2 -translate-x-1/2 text-sm font-extrabold text-white drop-shadow">
            {bonusFlash ? '✨ PONTO DUPLO! ✨' : `sequência ×${combo}`}
          </p>
        )}

        {birds.map((bird) => (
          <button
            key={bird.id}
            type="button"
            aria-label="Pássaro"
            className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${bird.x}%`, top: `${bird.y + Math.sin(bird.wobble) * 4}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              hitBird(bird.id);
            }}
          >
            {bird.hit ? (
              <span className="block text-2xl">💥</span>
            ) : (
              <svg viewBox="-12 -8 24 16" className="h-full w-full" aria-hidden>
                <ellipse cx="0" cy="0" rx="6" ry="3.6" fill="#0ea5e9" />
                <circle cx="5" cy="-2.4" r="2.6" fill="#38bdf8" />
                <path d="M7.4 -2.6 l2.6 0.8 -2.6 1 Z" fill="#f59e0b" />
                <circle cx="5.7" cy="-3" r="0.5" fill="#0f172a" />
                <path d={`M-1 -1 q-3 ${Math.sin(bird.wobble * 2) * 4 - 3} -6 -1`} fill="none" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M-5.4 0.6 l-3.4 1.6 3 0.6 Z" fill="#0284c7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </GameShell>
  );
}
