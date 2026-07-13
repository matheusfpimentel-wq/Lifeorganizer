import type { CSSProperties, ReactNode, SVGProps } from 'react';

/**
 * Cenários ilustrados dos módulos — mesma linguagem visual da vila da home.
 * Cada módulo tem seu canto da vila com um personagem trabalhando nele.
 * Animações leves (motion-safe) reutilizam as keyframes globais do index.css.
 */

import { BuiltinAvatar } from '@/components/avatars';

type P = SVGProps<SVGSVGElement>;

const SWAY: CSSProperties = { transformBox: 'fill-box', transformOrigin: '50% 0%' };

export interface ScenePerson {
  id: string;
  avatar?: string | null;
  color?: string | null;
}

/** Pessoinha genérica que atravesa a cena andando (roupa/cabelo variam). */
function Passerby({ shirt, hair, delay, duration, y = 66, bag }: {
  shirt: string;
  hair: string;
  delay?: string;
  duration?: string;
  y?: number;
  bag?: boolean;
}) {
  return (
    <g className="animate-stroll" style={{ animationDelay: delay, animationDuration: duration }}>
      <g transform={`translate(0 ${y})`}>
        <circle cx="0" cy="-14" r="3.4" fill="#fcd9b8" />
        <path d="M-3.4 -15 a3.4 3.4 0 0 1 6.8 0 l-0.8 -1.6 h-5.2 Z" className={hair} />
        <rect x="-3" y="-10.4" width="6" height="9" rx="2.4" className={shirt} />
        <path d="M-1.6 -1.6 l-1.2 5.6 M1.6 -1.6 l1.2 5.6" strokeWidth="1.8" strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-400" />
        {bag && <path d="M3 -6 l3 1.4 l-0.6 4.6 l-3.4 -1.2 Z" className="fill-amber-300" />}
      </g>
    </g>
  );
}

/** Morador do lar em pé na cena, com o avatar escolhido como rosto. */
function PersonaFigure({ person, x, y, flip }: { person: ScenePerson; x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
      <g className="animate-bob" style={{ animationDuration: '3.4s' }}>
        <rect x="-3.4" y="0" width="6.8" height="10" rx="2.8" style={{ fill: person.color ?? '#0ea5e9' }} />
        <path d="M-1.8 9.6 l-1 3.6 M1.8 9.6 l1 3.6" strokeWidth="1.8" strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-400" />
        <path d="M-3.4 2.6 l-2.6 3 M3.4 2.6 l2.6 3" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: person.color ?? '#0ea5e9' }} />
        {person.avatar ? (
          <BuiltinAvatar slug={person.avatar} x={-5.5} y={-11.4} width={11} height={11} />
        ) : (
          <>
            <circle cx="0" cy="-4.6" r="4.4" fill="#fcd9b8" />
            <path d="M-4.4 -5.6 a4.4 4.4 0 0 1 8.8 0 l-1 -1.8 h-6.8 Z" className="fill-amber-900" />
          </>
        )}
      </g>
    </g>
  );
}

function Frame({ skyClass, children, ...props }: P & { skyClass: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 400 92" preserveAspectRatio="xMidYMax slice" aria-hidden {...props}>
      <rect width="400" height="92" className={skyClass} />
      {children}
      {/* véu inferior para o título ficar legível */}
      <rect y="52" width="400" height="40" fill="url(#sceneScrim)" />
      <defs>
        <linearGradient id="sceneScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.38" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Banco: bancário no balcão com moedas, fachada de colunas ao fundo. */
export function BankScene(props: P) {
  return (
    <Frame skyClass="fill-sky-200 dark:fill-slate-800" {...props}>
      <path d="M0 70 Q200 56 400 70 L400 92 L0 92 Z" className="fill-emerald-300 dark:fill-emerald-950" />
      {/* fachada à direita */}
      <g transform="translate(322 66)">
        <rect x="-42" y="-4" width="84" height="6" rx="2" className="fill-slate-300 dark:fill-slate-600" />
        <rect x="-36" y="-46" width="72" height="42" className="fill-slate-100 dark:fill-slate-400" />
        <path d="M-42 -46 L0 -66 L42 -46 Z" className="fill-slate-200 dark:fill-slate-500" />
        <circle cx="0" cy="-53" r="5.4" fill="url(#scGold)" />
        <rect x="-30" y="-40" width="8" height="34" className="fill-white dark:fill-slate-300" />
        <rect x="-13" y="-40" width="8" height="34" className="fill-white dark:fill-slate-300" />
        <rect x="5" y="-40" width="8" height="34" className="fill-white dark:fill-slate-300" />
        <rect x="22" y="-40" width="8" height="34" className="fill-white dark:fill-slate-300" />
      </g>
      {/* bancário no balcão */}
      <g transform="translate(120 64)">
        <circle cx="0" cy="-26" r="7.5" fill="#fcd9b8" />
        <path d="M-7.5 -28.5 a7.5 7.5 0 0 1 15 0 l-2 -2.4 h-11 Z" className="fill-slate-800" />
        <circle cx="-2.4" cy="-26.4" r="0.9" className="fill-slate-900" />
        <circle cx="2.4" cy="-26.4" r="0.9" className="fill-slate-900" />
        <path d="M-2 -22.8 q2 1.7 4 0" fill="none" strokeWidth="0.9" strokeLinecap="round" className="stroke-amber-800" />
        <path d="M-9 -18 L9 -18 L7 -2 L-7 -2 Z" className="fill-slate-700 dark:fill-slate-600" />
        <path d="M0 -18 l-2 5 2 8 2 -8 Z" className="fill-amber-400" />
        <rect x="-34" y="-4" width="68" height="12" rx="2" className="fill-amber-700 dark:fill-amber-800" />
        <rect x="-34" y="-6" width="68" height="3.4" rx="1.6" className="fill-amber-600 dark:fill-amber-700" />
        {/* pilhas de moedas */}
        <g className="motion-safe:animate-pulse" style={{ animationDuration: '3s' }}>
          <ellipse cx="-22" cy="-8" rx="4" ry="1.6" fill="url(#scGold)" />
          <ellipse cx="-22" cy="-11" rx="4" ry="1.6" fill="url(#scGold)" />
          <ellipse cx="-22" cy="-14" rx="4" ry="1.6" fill="url(#scGold)" />
        </g>
        <ellipse cx="22" cy="-8" rx="4" ry="1.6" fill="url(#scGold)" />
        <ellipse cx="22" cy="-11" rx="4" ry="1.6" fill="url(#scGold)" />
      </g>
      {/* cofre do banco */}
      <g transform="translate(214 66)">
        <rect x="-11" y="-22" width="22" height="22" rx="2.4" className="fill-slate-600 dark:fill-slate-700" />
        <rect x="-8.4" y="-19.4" width="16.8" height="16.8" rx="1.8" className="fill-slate-500 dark:fill-slate-600" />
        <circle cx="0" cy="-11" r="4.6" fill="none" strokeWidth="1.6" className="stroke-slate-300" />
        <path d="M0 -11 v-3 M0 -11 l2.6 1.6" strokeWidth="1.1" strokeLinecap="round" className="stroke-slate-300" />
      </g>
      {/* dono do banco: de tempos em tempos vai conferir o cofre e volta */}
      <g className="animate-drift" style={{ animationDuration: '18s' }}>
        <g transform="translate(168 64)">
          <g className="animate-bob" style={{ animationDuration: '2.8s' }}>
            <circle cx="0" cy="-22" r="5.6" fill="#fcd9b8" />
            <path d="M-5.6 -23.6 a5.6 5.6 0 0 1 11.2 0 l-1.4 -2 h-8.6 Z" className="fill-stone-300" />
            <circle cx="-1.8" cy="-22.3" r="0.7" className="fill-slate-900" />
            <circle cx="1.8" cy="-22.3" r="0.7" className="fill-slate-900" />
            <path d="M-1.4 -19.6 q1.4 1.2 2.8 0" fill="none" strokeWidth="0.7" strokeLinecap="round" className="stroke-amber-800" />
            <path d="M-6.5 -16 L6.5 -16 L5 -1 L-5 -1 Z" className="fill-slate-800 dark:fill-slate-900" />
            <path d="M0 -16 l-1.6 4 1.6 6.4 1.6 -6.4 Z" className="fill-rose-500" />
            <path d="M6 -12 q3.4 -1 4.6 -3.6" fill="none" strokeWidth="2" strokeLinecap="round" stroke="#fcd9b8" />
            <ellipse cx="12" cy="-16.6" rx="2.6" ry="1" fill="url(#scGold)" />
          </g>
        </g>
      </g>
      {/* clientes na fila do balcão */}
      <g transform="translate(64 66)">
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${i * 16} 0)`} className="animate-bob" style={{ animationDuration: `${3.2 + i * 0.7}s`, animationDelay: `${i * 0.5}s` }}>
            <circle cx="0" cy="-17" r="4" fill={i ? '#f0c8a0' : '#fcd9b8'} />
            <path d="M-4 -18.2 a4 4 0 0 1 8 0 l-1 -1.8 h-6 Z" className={i ? 'fill-slate-800' : 'fill-amber-900'} />
            <rect x="-3.6" y="-12.6" width="7.2" height="11" rx="2.8" className={i ? 'fill-sky-600' : 'fill-emerald-600'} />
          </g>
        ))}
      </g>
      {/* ladrão em disparada com a polícia logo atrás */}
      <g className="animate-stroll" style={{ animationDuration: '44s', animationDelay: '6s' }}>
        <g transform="translate(0 66)">
          {/* ladrão: máscara e saco de moedas */}
          <g transform="rotate(8)">
            <circle cx="0" cy="-14" r="3.4" fill="#fcd9b8" />
            <rect x="-3.4" y="-15.4" width="6.8" height="2.6" rx="1.2" className="fill-slate-900" />
            <circle cx="-1.2" cy="-14.2" r="0.55" fill="#fff" />
            <circle cx="1.6" cy="-14.2" r="0.55" fill="#fff" />
            <path d="M-3.4 -17 a3.4 3.4 0 0 1 6.8 0 Z" className="fill-slate-700" />
            <rect x="-3" y="-10.6" width="6" height="9" rx="2.4" className="fill-slate-700" />
            <path d="M-1.6 -1.8 l-2.6 4.6 M1.6 -1.8 l2.8 4" strokeWidth="1.8" strokeLinecap="round" className="stroke-slate-800 dark:stroke-slate-400" />
            <path d="M3 -9 q4 -2.4 5.6 -0.4" fill="none" strokeWidth="1.6" strokeLinecap="round" stroke="#fcd9b8" />
            <circle cx="10" cy="-8.4" r="3.2" className="fill-amber-200" />
            <path d="M8.6 -10.8 l1.4 -1.4 l1.4 1.4" fill="none" strokeWidth="0.9" className="stroke-amber-700" />
          </g>
          {/* policial correndo atrás */}
          <g transform="translate(-22 0) rotate(6)">
            <circle cx="0" cy="-14" r="3.4" fill="#f0c8a0" />
            <path d="M-3.8 -15.2 h7.6 l-0.8 -2.4 a3.4 3.4 0 0 0 -6 0 Z" className="fill-sky-900" />
            <rect x="-1.4" y="-19.2" width="2.8" height="1.6" rx="0.7" className="fill-sky-900" />
            <rect x="-3" y="-10.6" width="6" height="9" rx="2.4" className="fill-sky-800" />
            <path d="M-1.6 -1.8 l-2.8 4.2 M1.6 -1.8 l2.6 4.4" strokeWidth="1.8" strokeLinecap="round" className="stroke-slate-800 dark:stroke-slate-400" />
            <path d="M3 -8.6 l4 -2.6" strokeWidth="1.6" strokeLinecap="round" stroke="#f0c8a0" />
          </g>
        </g>
      </g>
      {/* moedas soltas */}
      <circle cx="250" cy="30" r="4" fill="url(#scGold)" className="animate-bob" />
      <circle cx="278" cy="44" r="2.8" fill="url(#scGold)" className="animate-bob" style={{ animationDelay: '1s' }} />
      <defs>
        <linearGradient id="scGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </Frame>
  );
}

/** Mercado: toldo listrado, atendente e caixotes de frutas. */
export function MarketScene(props: P) {
  return (
    <Frame skyClass="fill-emerald-100 dark:fill-slate-800" {...props}>
      {/* toldo no topo */}
      <g>
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i}
            x={i * 40}
            y="0"
            width="40"
            height="18"
            rx="6"
            className={i % 2 === 0 ? 'fill-emerald-500 dark:fill-emerald-700' : 'fill-white dark:fill-slate-300'}
          />
        ))}
        <rect x="0" y="0" width="400" height="8" className="fill-emerald-600 dark:fill-emerald-800" />
      </g>
      <path d="M0 74 Q200 62 400 74 L400 92 L0 92 Z" className="fill-emerald-300 dark:fill-emerald-950" />
      {/* caixotes de frutas */}
      <g transform="translate(86 62)">
        <rect x="-26" y="-12" width="52" height="16" rx="2" className="fill-amber-700 dark:fill-amber-800" />
        <rect x="-23" y="-9" width="46" height="10" rx="1.5" className="fill-amber-200 dark:fill-amber-300" />
        {[-16, -8, 0, 8, 16].map((x, i) => (
          <circle key={i} cx={x} cy="-4" r="3.6" className={i % 2 ? 'fill-orange-400' : 'fill-rose-400'} />
        ))}
      </g>
      <g transform="translate(150 66)">
        <rect x="-20" y="-10" width="40" height="13" rx="2" className="fill-amber-700 dark:fill-amber-800" />
        {[-11, -3, 5].map((x, i) => (
          <circle key={i} cx={x + 3} cy="-3" r="3.2" className={i % 2 ? 'fill-lime-400' : 'fill-amber-300'} />
        ))}
      </g>
      {/* atendente */}
      <g transform="translate(268 64)">
      <g className="animate-bob" style={{ animationDuration: '3.6s' }}>
        <circle cx="0" cy="-26" r="7.5" fill="#fcd9b8" />
        <path d="M-7.5 -28.5 a7.5 7.5 0 0 1 15 0 l-1.6 -2.6 h-11.8 Z" className="fill-amber-900" />
        <circle cx="-2.4" cy="-26.4" r="0.9" className="fill-slate-900" />
        <circle cx="2.4" cy="-26.4" r="0.9" className="fill-slate-900" />
        <path d="M-2 -22.8 q2 1.7 4 0" fill="none" strokeWidth="0.9" strokeLinecap="round" className="stroke-amber-800" />
        <path d="M-9 -18 L9 -18 L7.4 -1 L-7.4 -1 Z" className="fill-emerald-600 dark:fill-emerald-700" />
        <rect x="-5.4" y="-14" width="10.8" height="9" rx="1.6" className="fill-emerald-100 dark:fill-emerald-200" />
        <circle cx="12" cy="-13" r="3.4" className="fill-rose-400" />
        <path d="M8 -15 q2.6 -3.4 4.6 -1" fill="none" strokeWidth="1.4" strokeLinecap="round" stroke="#fcd9b8" />
      </g>
      </g>
      {/* feirante arrumando os caixotes */}
      <g transform="translate(196 66)">
        <g className="animate-bob" style={{ animationDuration: '2.4s' }}>
          <circle cx="0" cy="-18" r="4.4" fill="#f0c8a0" />
          <path d="M-5.4 -18.6 h10.8 l-1.2 -2.8 a4.4 4.4 0 0 0 -8.4 0 Z" className="fill-amber-400" />
          <rect x="-4" y="-12.6" width="8" height="10" rx="2.6" className="fill-sky-700" />
          <path d="M-4 -10 l-3.4 4.6 M4 -10 l3.4 4.6" strokeWidth="1.6" strokeLinecap="round" stroke="#f0c8a0" />
          <circle cx="-7.8" cy="-4.6" r="2" className="fill-orange-400" />
        </g>
      </g>
      {/* clientes passando com sacolas */}
      <Passerby shirt="fill-rose-500" hair="fill-slate-800" duration="30s" bag />
      <Passerby shirt="fill-violet-600" hair="fill-amber-900" duration="42s" delay="14s" y={70} bag />
    </Frame>
  );
}

/** Academia: maromba no supino em pé, anilhas e kettlebell. */
export function GymScene(props: P) {
  return (
    <Frame skyClass="fill-violet-100 dark:fill-slate-800" {...props}>
      <rect y="70" width="400" height="22" className="fill-slate-300 dark:fill-slate-700" />
      <rect y="70" width="400" height="3" className="fill-slate-400 dark:fill-slate-600" />
      {/* rack de halteres */}
      <g transform="translate(88 70)">
        <rect x="-34" y="-16" width="68" height="4" rx="1.6" className="fill-slate-500 dark:fill-slate-500" />
        <rect x="-34" y="-2" width="68" height="4" rx="1.6" className="fill-slate-500 dark:fill-slate-500" />
        <path d="M-30 -16 v18 M30 -16 v18" strokeWidth="3" className="stroke-slate-600 dark:stroke-slate-500" />
        {[-18, 0, 18].map((x) => (
          <g key={`t${x}`}>
            <rect x={x - 9} y="-21.4" width="18" height="2.4" rx="1.2" className="fill-slate-700 dark:fill-slate-400" />
            <circle cx={x - 8} cy="-20.2" r="3.4" className="fill-violet-500 dark:fill-violet-600" />
            <circle cx={x + 8} cy="-20.2" r="3.4" className="fill-violet-500 dark:fill-violet-600" />
          </g>
        ))}
      </g>
      {/* maromba gigante */}
      <g transform="translate(240 70)">
        <path d="M-4 -6 l-1.6 6 M4 -6 l1.6 6" strokeWidth="3.6" strokeLinecap="round" className="stroke-slate-800 dark:stroke-slate-900" />
        <path d="M-9 -25 L9 -25 L5.6 -6 L-5.6 -6 Z" className="fill-rose-600 dark:fill-rose-700" />
        <circle cx="0" cy="-31" r="6.4" fill="#fcd9b8" />
        <path d="M-6.4 -32.8 a6.4 6.4 0 0 1 12.8 0 l-1.4 -2 h-10 Z" className="fill-slate-900" />
        <circle cx="-2" cy="-31.2" r="0.8" className="fill-slate-900" />
        <circle cx="2" cy="-31.2" r="0.8" className="fill-slate-900" />
        <path d="M-1.6 -28.2 q1.6 1.4 3.2 0" fill="none" strokeWidth="0.8" strokeLinecap="round" className="stroke-amber-800" />
        <g className="animate-lift">
          <path d="M-8 -27 L-13.6 -38 M8 -27 L13.6 -38" strokeWidth="3.6" strokeLinecap="round" stroke="#fcd9b8" fill="none" />
          <rect x="-22" y="-42" width="44" height="3.6" rx="1.8" className="fill-slate-700 dark:fill-slate-300" />
          <circle cx="-22.6" cy="-40.2" r="6" className="fill-violet-500 dark:fill-violet-400" />
          <circle cx="22.6" cy="-40.2" r="6" className="fill-violet-500 dark:fill-violet-400" />
        </g>
      </g>
      {/* kettlebell */}
      <g transform="translate(330 70)">
        <path d="M-4.4 -12 a5 5 0 0 1 8.8 0" fill="none" strokeWidth="2.6" className="stroke-slate-700 dark:stroke-slate-400" />
        <circle cx="0" cy="-6" r="7" className="fill-slate-700 dark:fill-slate-500" />
      </g>
      {/* corredor na esteira do fundo passa de vez em quando */}
      <Passerby shirt="fill-emerald-500" hair="fill-slate-900" duration="16s" y={68} />
    </Frame>
  );
}

/** Pracinha/Agenda: coreto, bandeirinhas e balões subindo. */
export function ParkScene(props: P) {
  return (
    <Frame skyClass="fill-violet-100 dark:fill-indigo-950" {...props}>
      <path d="M0 72 Q200 58 400 72 L400 92 L0 92 Z" className="fill-emerald-300 dark:fill-emerald-950" />
      {/* bandeirinhas */}
      <path d="M0 14 Q100 34 200 22 T400 12" fill="none" strokeWidth="1.2" className="stroke-stone-500/80" />
      {[
        [46, 24, 'fill-rose-400'], [96, 32, 'fill-amber-400'], [146, 30, 'fill-sky-400'],
        [196, 24, 'fill-violet-400'], [250, 22, 'fill-emerald-400'], [304, 18, 'fill-rose-400'], [352, 14, 'fill-amber-400'],
      ].map(([x, y, c], i) => (
        <path key={i} d={`M${x} ${y} l9 0 l-4.5 10 Z`} className={c as string} />
      ))}
      {/* coreto */}
      <g transform="translate(300 70)">
        <ellipse cx="0" cy="0" rx="38" ry="7" className="fill-stone-300 dark:fill-slate-600" />
        <path d="M-26 -32 v30 M26 -32 v30" strokeWidth="4" className="stroke-stone-400 dark:stroke-stone-500" />
        <path d="M-34 -30 L0 -52 L34 -30 Z" className="fill-violet-400 dark:fill-violet-500" />
        <rect x="-12" y="-12" width="24" height="4" rx="1.6" className="fill-amber-800" />
      </g>
      {/* balões */}
      <g transform="translate(90 40)">
      <g className="animate-bob">
        <path d="M0 0 v14 M11 -4 v18 M-11 -3 v17" strokeWidth="0.9" className="stroke-stone-500" fill="none" />
        <ellipse cx="0" cy="-7" rx="6.4" ry="8" className="fill-rose-400" />
        <ellipse cx="11" cy="-11" rx="5.6" ry="7" className="fill-sky-400" />
        <ellipse cx="-11" cy="-10" rx="5.6" ry="7" className="fill-amber-400" />
      </g>
      </g>
      {/* banco de praça com velhinhos namorando */}
      <g transform="translate(180 72)">
        <rect x="-16" y="-8" width="32" height="3.4" rx="1.6" className="fill-amber-800" />
        <rect x="-16" y="-15" width="32" height="3" rx="1.5" className="fill-amber-700" />
        <path d="M-13 -5 v7 M13 -5 v7" strokeWidth="2.4" className="stroke-amber-900" />
        {/* vovô */}
        <g transform="translate(-6 -8)">
          <circle cx="0" cy="-8.4" r="3.6" fill="#f0c8a0" />
          <path d="M-3.6 -9.6 a3.6 3.6 0 0 1 7.2 0 Z" className="fill-slate-100" />
          <path d="M-2.2 -8 h1.6 M0.8 -8 h1.6 M-0.6 -8 h1.4" strokeWidth="0.55" className="stroke-slate-500" />
          <rect x="-3.4" y="-5" width="6.8" height="6" rx="2" className="fill-emerald-700" />
          <path d="M-2 1 v3.4 M2 1 v3.4" strokeWidth="1.6" strokeLinecap="round" className="stroke-slate-700" />
        </g>
        {/* vovó com coquinho, cabeça encostada */}
        <g transform="translate(4.5 -8) rotate(-10)">
          <circle cx="0" cy="-8.2" r="3.4" fill="#fcd9b8" />
          <path d="M-3.4 -9 a3.4 3.4 0 0 1 6.8 0 Z" className="fill-slate-200" />
          <circle cx="0" cy="-12" r="1.4" className="fill-slate-200" />
          <rect x="-3.2" y="-5" width="6.4" height="6" rx="2" className="fill-rose-400" />
          <path d="M-1.8 1 v3.2 M1.8 1 v3.2" strokeWidth="1.5" strokeLinecap="round" className="stroke-slate-700" />
        </g>
        {/* coração dos pombinhos */}
        <path d="M-0.5 -22 c-1 -1.8 -3.8 -1.4 -3.8 0.6 c0 1.6 2.4 2.8 3.8 3.9 c1.4 -1.1 3.8 -2.3 3.8 -3.9 c0 -2 -2.8 -2.4 -3.8 -0.6 Z" className="animate-heart fill-rose-400" />
      </g>
      {/* crianças correndo atrás uma da outra */}
      <g className="animate-stroll" style={{ animationDuration: '17s' }}>
        <g transform="translate(0 70)">
          <g transform="rotate(6)">
            <circle cx="0" cy="-10.4" r="2.8" fill="#fcd9b8" />
            <path d="M-2.8 -11.4 a2.8 2.8 0 0 1 5.6 0 l-0.6 -1.2 h-4.4 Z" className="fill-amber-800" />
            <rect x="-2.4" y="-7.4" width="4.8" height="6" rx="2" className="fill-sky-500" />
            <path d="M-1.2 -1.6 l-1.8 3.2 M1.2 -1.6 l2 2.8" strokeWidth="1.5" strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-400" />
          </g>
          <g transform="translate(-14 0) rotate(8)">
            <circle cx="0" cy="-10.4" r="2.8" fill="#f0c8a0" />
            <path d="M-2.8 -11 a2.8 2.8 0 0 1 5.6 0 Z" className="fill-slate-900" />
            <path d="M0 -13.4 v-1.6" strokeWidth="0.8" strokeLinecap="round" className="stroke-slate-900" />
            <rect x="-2.4" y="-7.4" width="4.8" height="6" rx="2" className="fill-amber-500" />
            <path d="M-1.2 -1.6 l-2 2.8 M1.2 -1.6 l1.8 3.2" strokeWidth="1.5" strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-400" />
          </g>
        </g>
      </g>
      {/* alguém passeando com calma */}
      <Passerby shirt="fill-stone-600" hair="fill-stone-300" duration="46s" delay="20s" y={70} />
    </Frame>
  );
}

/** Casinha/Tarefas: casa, varal ao vento, vassoura — e os moradores na frente. */
export function HouseScene({ people, ...props }: P & { people?: ScenePerson[] }) {
  return (
    <Frame skyClass="fill-rose-100 dark:fill-slate-800" {...props}>
      <path d="M0 72 Q200 58 400 72 L400 92 L0 92 Z" className="fill-emerald-300 dark:fill-emerald-950" />
      {/* casinha à esquerda */}
      <g transform="translate(86 68)">
        <rect x="-34" y="-36" width="68" height="36" rx="2" className="fill-orange-50 dark:fill-slate-500" />
        <path d="M-40 -36 L0 -60 L40 -36 Z" className="fill-rose-500 dark:fill-rose-600" />
        <path d="M0 -43 c-1.8 -3.2 -6.6 -2.6 -6.6 0.7 c0 2.6 4.2 4.8 6.6 6.6 c2.4 -1.8 6.6 -4 6.6 -6.6 c0 -3.3 -4.8 -3.9 -6.6 -0.7 Z" className="fill-rose-300" />
        <rect x="-26" y="-27" width="13" height="10" rx="1.5" className="fill-sky-200 dark:fill-amber-200" />
        <rect x="-8" y="-19" width="16" height="19" rx="2" className="fill-amber-700 dark:fill-amber-800" />
        <rect x="15" y="-27" width="13" height="10" rx="1.5" className="fill-sky-200 dark:fill-amber-200" />
      </g>
      {/* varal com roupinhas ao vento */}
      <g transform="translate(240 66)">
        <path d="M-56 -28 v28 M56 -28 v28" strokeWidth="3" className="stroke-amber-800" />
        <path d="M-56 -26 Q0 -18 56 -26" fill="none" strokeWidth="1.1" className="stroke-stone-500" />
        <g className="animate-sway" style={SWAY}>
          <path d="M-34 -23.4 l-5 3 v7 h10 v-7 Z" className="fill-sky-400" />
        </g>
        <g className="animate-sway" style={{ ...SWAY, animationDelay: '0.9s' }}>
          <rect x="-9" y="-21.6" width="14" height="12" rx="1.5" className="fill-rose-300" />
        </g>
        <g className="animate-sway" style={{ ...SWAY, animationDelay: '1.7s' }}>
          <path d="M22 -22.6 h8 v6 l-2.6 4 h-2.8 l-2.6 -4 Z" className="fill-amber-300" />
        </g>
      </g>
      {/* vassoura e balde */}
      <g transform="translate(342 70)">
        <path d="M0 -30 l6 24" strokeWidth="2" className="stroke-amber-800" />
        <path d="M2 -8 l9 4 l-4 6 l-9 -6 Z" className="fill-amber-400" />
        <path d="M-16 -8 h12 l-1.6 9 h-8.8 Z" className="fill-slate-400 dark:fill-slate-500" />
        <path d="M-15 -8 a5 5 0 0 1 10 0" fill="none" strokeWidth="1.2" className="stroke-slate-500" />
      </g>
      {/* gato no telhado */}
      <g transform="translate(112 34)">
        <g className="animate-tail">
          <path d="M4 -0.6 q4 -1.4 3.2 -5.2" fill="none" strokeWidth="1.3" strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-400" />
        </g>
        <ellipse cx="0" cy="0" rx="4.2" ry="2.7" className="fill-slate-700 dark:fill-slate-400" />
        <circle cx="-4" cy="-2.6" r="2.3" className="fill-slate-700 dark:fill-slate-400" />
        <path d="M-5.8 -4.4 l0.9 -1.8 l1.2 1.4 Z M-3.2 -4.7 l1 -1.6 l0.9 1.8 Z" className="fill-slate-700 dark:fill-slate-400" />
        <circle cx="-4.7" cy="-2.8" r="0.35" className="fill-amber-300" />
        <circle cx="-3.1" cy="-2.8" r="0.35" className="fill-amber-300" />
      </g>
      {/* moradores do lar na frente da casinha (avatares como personas) */}
      {(people ?? []).slice(0, 4).map((person, i) => (
        <PersonaFigure key={person.id} person={person} x={150 + i * 22} y={56} flip={i % 2 === 1} />
      ))}
      {/* alguém passa varrendo a calçada */}
      <Passerby shirt="fill-amber-600" hair="fill-slate-800" duration="40s" delay="9s" y={70} />
    </Frame>
  );
}

/** Cabeçalho de módulo: cena ilustrada com título e ação sobrepostos. */
export function ModuleHero({
  scene,
  title,
  action,
}: {
  scene: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl shadow-md">
      {scene}
      <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
        <h1 className="text-2xl font-bold text-white drop-shadow-md">{title}</h1>
        {action && <div className="flex shrink-0 gap-2">{action}</div>}
      </div>
    </header>
  );
}
