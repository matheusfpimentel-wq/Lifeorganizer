import type { CSSProperties, ReactNode, SVGProps } from 'react';

/**
 * Cenários ilustrados dos módulos — mesma linguagem visual da vila da home.
 * Cada módulo tem seu canto da vila com um personagem trabalhando nele.
 * Animações leves (motion-safe) reutilizam as keyframes globais do index.css.
 */

type P = SVGProps<SVGSVGElement>;

const SWAY: CSSProperties = { transformBox: 'fill-box', transformOrigin: '50% 0%' };

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
      {/* moedas soltas */}
      <circle cx="220" cy="30" r="4" fill="url(#scGold)" className="animate-bob" />
      <circle cx="250" cy="44" r="2.8" fill="url(#scGold)" className="animate-bob" style={{ animationDelay: '1s' }} />
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
        <path d="M-9 -18 L9 -18 L7.4 -1 L-7.4 -1 Z" className="fill-emerald-600 dark:fill-emerald-700" />
        <rect x="-5.4" y="-14" width="10.8" height="9" rx="1.6" className="fill-emerald-100 dark:fill-emerald-200" />
        <circle cx="12" cy="-13" r="3.4" className="fill-rose-400" />
        <path d="M8 -15 q2.6 -3.4 4.6 -1" fill="none" strokeWidth="1.4" strokeLinecap="round" stroke="#fcd9b8" />
      </g>
      </g>
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
      {/* banco de praça */}
      <g transform="translate(180 72)">
        <rect x="-16" y="-8" width="32" height="3.4" rx="1.6" className="fill-amber-800" />
        <rect x="-16" y="-15" width="32" height="3" rx="1.5" className="fill-amber-700" />
        <path d="M-13 -5 v7 M13 -5 v7" strokeWidth="2.4" className="stroke-amber-900" />
      </g>
    </Frame>
  );
}

/** Casinha/Tarefas: casa, varal de roupas ao vento e vassoura. */
export function HouseScene(props: P) {
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
