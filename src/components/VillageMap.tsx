import { useMemo, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCentsBRL } from '@/lib/format';

interface VillageMapProps {
  /** Saldo do usuário em centavos; null enquanto carrega. */
  balanceCents: number | null;
  /** Itens pendentes na lista de compras. */
  marketCount: number;
  /** Tarefas pendentes de hoje. */
  todayTasks: number;
  /** Tarefas atrasadas. */
  overdueTasks: number;
  /** Próximo evento de hoje, ex.: "14:00 Dentista" (null = agenda livre). */
  nextEventLabel: string | null;
  /** Alguém concluiu tarefa hoje (acende a chaminé). */
  completedToday?: boolean;
  /** Níveis de evolução (0–3) por construção; a vila cresce com o uso. */
  progress?: { house: number; gym: number; bank: number; park: number; nature: number };
  /** Força um easter egg específico (testes/demonstração). */
  eggOverride?: Egg;
  /** Clima real (Open-Meteo): a vila obedece à previsão. */
  weather?: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | null;
}

type Egg = 'ufo' | 'monster' | 'alien' | 'walker' | null;

/** vento: gira em torno da base do elemento */
const SWAY: CSSProperties = { transformBox: 'fill-box', transformOrigin: '50% 100%' };

type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

/** Fase do céu pelo horário REAL de São Paulo (UTC−3 fixo), não pelo tema. */
function skyPhase(): SkyPhase {
  const hour = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

const SKY_BY_PHASE: Record<SkyPhase, string> = {
  dawn: 'fill-rose-100 dark:fill-slate-900',
  day: 'fill-sky-100 dark:fill-slate-950',
  dusk: 'fill-orange-100 dark:fill-indigo-950',
  night: 'fill-indigo-950 dark:fill-slate-950',
};

/** [cx, cy, cor] das florzinhas base e das extras de jardim florido. */
const BASE_FLOWERS: Array<[number, number, string]> = [
  [162, 266, 'fill-rose-400'], [171, 271, 'fill-amber-400'], [236, 268, 'fill-rose-400'],
  [228, 273, 'fill-violet-400'], [58, 182, 'fill-rose-400'], [64, 186, 'fill-amber-400'],
  [342, 186, 'fill-violet-400'], [348, 182, 'fill-rose-400'],
];
const EXTRA_FLOWERS: Array<[number, number, string]> = [
  [188, 262, 'fill-rose-300'], [212, 266, 'fill-violet-300'], [122, 248, 'fill-amber-300'],
  [278, 246, 'fill-rose-300'], [96, 210, 'fill-violet-300'], [306, 206, 'fill-amber-300'],
];

interface Spot {
  route: string;
  aria: string;
}

/**
 * Mapa ilustrado da vila: a casinha no centro e caminhos para os lugares do
 * dia a dia. Cada construção navega para o módulo correspondente. De dia tem
 * sol; no modo escuro a vila anoitece (lua, estrelas e janelas acesas).
 */
export default function VillageMap(props: VillageMapProps) {
  const navigate = useNavigate();
  const phase = skyPhase();
  // janelas acesas quando anoitece de verdade (ou no tema escuro)
  const windowGlass = phase === 'night' || phase === 'dusk' ? 'fill-amber-200' : 'fill-sky-200 dark:fill-amber-200';
  // jardim reage ao estado do lar: atrasos murcham, tudo em dia floresce
  const garden = props.overdueTasks > 0 ? 'wilted' : props.todayTasks === 0 ? 'blooming' : 'ok';
  // evolução da vila (0–3 por construção)
  const prog = props.progress ?? { house: 0, gym: 0, bank: 0, park: 0, nature: 0 };
  const villageLevel = prog.house + prog.gym + prog.bank + prog.park;

  const rainy = props.weather === 'rain' || props.weather === 'storm';
  // decoração sazonal pelo mês em São Paulo
  const spMonth = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCMonth(); // 0=jan
  const season = spMonth === 5 || spMonth === 6 ? 'junina' : spMonth === 11 ? 'natal' : spMonth === 9 ? 'halloween' : null;

  // easter egg sorteado a cada visita à home (às vezes ninguém aparece)
  const egg = useMemo<Egg>(() => {
    if (props.eggOverride !== undefined) return props.eggOverride;
    const roll = Math.random();
    if (roll < 0.1) return 'ufo';
    if (roll < 0.2) return 'monster';
    if (roll < 0.3) return 'alien';
    if (roll < 0.55) return 'walker';
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.eggOverride]);

  const go = (spot: Spot) => ({
    role: 'link' as const,
    tabIndex: 0,
    'aria-label': spot.aria,
    className: 'cursor-pointer transition-opacity hover:opacity-80 focus-visible:opacity-80 outline-none',
    onClick: () => navigate(spot.route),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(spot.route);
      }
    },
  });

  const balanceText = props.balanceCents === null ? '—' : formatCentsBRL(props.balanceCents);
  const balanceTone =
    props.balanceCents === null || props.balanceCents === 0
      ? 'text-slate-500 dark:text-slate-400'
      : props.balanceCents > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400';

  const houseChip =
    props.overdueTasks > 0
      ? { text: `${props.overdueTasks} atrasada${props.overdueTasks > 1 ? 's' : ''}`, tone: 'text-rose-600 dark:text-rose-400' }
      : props.todayTasks > 0
        ? { text: `${props.todayTasks} tarefa${props.todayTasks > 1 ? 's' : ''} hoje`, tone: 'text-slate-600 dark:text-slate-300' }
        : { text: 'tudo em dia', tone: 'text-emerald-600 dark:text-emerald-400' };

  const eventText =
    props.nextEventLabel === null
      ? 'livre hoje'
      : props.nextEventLabel.length > 18
        ? `${props.nextEventLabel.slice(0, 17)}…`
        : props.nextEventLabel;

  const chipClass =
    'pointer-events-none absolute -translate-x-1/2 -translate-y-full select-none whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900/95';

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200 shadow-md dark:border-slate-800" style={{ aspectRatio: '4 / 3' }}>
      <svg viewBox="0 0 400 300" className="block h-full w-full" aria-hidden="false">
        <title>Mapa da vila: toque num lugar para abrir o módulo</title>
        <defs>
          <linearGradient id="vmRoof" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fb7185" />
            <stop offset="1" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="vmGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fde047" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="vmWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff7ed" />
            <stop offset="1" stopColor="#fed7aa" />
          </linearGradient>
        </defs>

        {/* céu segue o horário real de São Paulo (e fecha quando chove) */}
        <rect
          width="400"
          height="300"
          className={
            rainy && phase !== 'night'
              ? 'fill-slate-300 dark:fill-slate-900'
              : props.weather === 'fog' && phase !== 'night'
                ? 'fill-slate-200 dark:fill-slate-900'
                : SKY_BY_PHASE[phase]
          }
        />

        {/* sol (amanhecer baixo, dia alto, entardecer se pondo) */}
        {phase === 'dawn' && !rainy && props.weather !== 'fog' && (
          <g className="dark:hidden">
            <circle cx="72" cy="80" r="22" className="fill-rose-200" opacity="0.7" />
            <circle cx="72" cy="80" r="13" className="fill-amber-300" />
          </g>
        )}
        {phase === 'day' && !rainy && props.weather !== 'fog' && (
          <g className="dark:hidden">
            <circle cx="346" cy="44" r="24" className="fill-amber-200" opacity="0.6" />
            <circle cx="346" cy="44" r="15" className="fill-amber-300" />
          </g>
        )}
        {phase === 'dusk' && !rainy && props.weather !== 'fog' && (
          <g className="dark:hidden">
            <circle cx="330" cy="86" r="22" className="fill-orange-200" opacity="0.8" />
            <circle cx="330" cy="86" r="13" className="fill-orange-400" />
          </g>
        )}

        {/* lua e estrelas: à noite de verdade, ou sempre no tema escuro */}
        <g className={phase === 'night' ? '' : 'hidden dark:inline'}>
          <circle cx="346" cy="44" r="14" className="fill-amber-100" />
          <circle cx="341" cy="40" r="3" className="fill-amber-200" opacity="0.7" />
          <circle cx="350" cy="49" r="2" className="fill-amber-200" opacity="0.7" />
          <circle cx="60" cy="36" r="1.5" className="fill-white motion-safe:animate-pulse" />
          <circle cx="120" cy="58" r="1.2" className="fill-white" opacity="0.8" />
          <circle cx="210" cy="30" r="1.5" className="fill-white motion-safe:animate-pulse" />
          <circle cx="270" cy="62" r="1.2" className="fill-white" opacity="0.7" />
          <circle cx="30" cy="80" r="1.2" className="fill-white" opacity="0.8" />
        </g>

        {/* nuvens à deriva (somem à noite) */}
        {phase !== 'night' && (
          <g className="animate-drift fill-white dark:opacity-10" opacity="0.9">
            <ellipse cx="90" cy="46" rx="26" ry="10" />
            <ellipse cx="112" cy="40" rx="18" ry="8" />
            <ellipse cx="235" cy="66" rx="22" ry="8" opacity="0.7" />
          </g>
        )}

        {/* nuvens carregadas quando o tempo fecha */}
        {(rainy || props.weather === 'cloudy') && (
          <g className={rainy ? 'fill-slate-400 dark:fill-slate-700' : 'fill-slate-300/90 dark:fill-slate-700/80'}>
            <ellipse cx="150" cy="38" rx="34" ry="11" />
            <ellipse cx="182" cy="32" rx="22" ry="9" />
            <ellipse cx="300" cy="52" rx="30" ry="10" />
            <ellipse cx="60" cy="60" rx="26" ry="9" />
          </g>
        )}

        {/* relâmpago na tempestade */}
        {props.weather === 'storm' && (
          <path d="M162 44 l-10 18 h7 l-9 17 16 -13 h-6 l9 -14 Z" className="animate-flash fill-amber-200" />
        )}

        {/* passarinhos cruzando o céu (se recolhem na chuva) */}
        {phase !== 'night' && !rainy && (
          <g className="animate-fly" fill="none" strokeWidth="1.2" strokeLinecap="round">
            <path d="M0 56 q3 -3.2 6 0 q3 -3.2 6 0" className="stroke-slate-500/70 dark:stroke-slate-300/50" />
            <path d="M16 49 q2.6 -2.8 5.2 0 q2.6 -2.8 5.2 0" className="stroke-slate-500/60 dark:stroke-slate-300/40" />
          </g>
        )}

        {/* easter egg: disco voador */}
        {egg === 'ufo' && (
          <g className="animate-ufo">
            <g transform="translate(0 46)">
              <path d="M-5 -2.5 a5 4.6 0 0 1 10 0 Z" className="fill-sky-300/90" />
              <ellipse cx="0" cy="0" rx="11" ry="3.6" className="fill-slate-400 dark:fill-slate-500" />
              <circle cx="-6" cy="0.6" r="1" className="fill-amber-300 motion-safe:animate-pulse" />
              <circle cx="0" cy="1.4" r="1" className="fill-rose-300 motion-safe:animate-pulse" />
              <circle cx="6" cy="0.6" r="1" className="fill-emerald-300 motion-safe:animate-pulse" />
            </g>
          </g>
        )}

        {/* colinas */}
        <path d="M0 130 Q100 98 200 122 T400 116 L400 300 L0 300 Z" className="fill-emerald-200 dark:fill-emerald-950" />
        <path d="M0 200 Q200 168 400 202 L400 300 L0 300 Z" className="fill-emerald-300/60 dark:fill-emerald-900/60" />

        {/* trilhas discretas de terra batida saindo da casinha */}
        <g fill="none" strokeLinecap="round">
          <g strokeWidth="5.5" className="stroke-amber-800/15 dark:stroke-amber-950/30">
            <path d="M197 196 C 168 208, 158 174, 128 182 C 102 189, 98 160, 74 151" />
            <path d="M203 196 C 238 210, 244 172, 276 180 C 302 186, 304 158, 326 151" />
            <path d="M196 198 C 178 228, 138 216, 120 236 C 106 251, 96 244, 82 253" />
            <path d="M204 198 C 228 226, 264 212, 282 232 C 296 247, 306 242, 318 253" />
          </g>
          <g strokeWidth="3" className="stroke-amber-200/60 dark:stroke-amber-900/40">
            <path d="M197 196 C 168 208, 158 174, 128 182 C 102 189, 98 160, 74 151" />
            <path d="M203 196 C 238 210, 244 172, 276 180 C 302 186, 304 158, 326 151" />
            <path d="M196 198 C 178 228, 138 216, 120 236 C 106 251, 96 244, 82 253" />
            <path d="M204 198 C 228 226, 264 212, 282 232 C 296 247, 306 242, 318 253" />
          </g>
        </g>

        {/* pedrinhas ao longo das trilhas */}
        <g className="fill-amber-800/25 dark:fill-amber-950/60">
          <ellipse cx="160" cy="188" rx="1.6" ry="1" />
          <ellipse cx="112" cy="176" rx="1.3" ry="0.9" />
          <ellipse cx="246" cy="186" rx="1.6" ry="1" />
          <ellipse cx="292" cy="172" rx="1.3" ry="0.9" />
          <ellipse cx="152" cy="222" rx="1.6" ry="1" />
          <ellipse cx="258" cy="219" rx="1.4" ry="0.9" />
        </g>

        {/* laguinho com água ondulando */}
        <g>
          <ellipse cx="200" cy="247" rx="19" ry="6.5" className="fill-sky-300 dark:fill-sky-900" />
          <ellipse cx="200" cy="246" rx="14" ry="4.5" className="fill-sky-200 dark:fill-sky-800" />
          <path d="M192 245 q3 -1.5 6 0 q3 1.5 6 0" fill="none" strokeWidth="0.8" className="stroke-sky-400 dark:stroke-sky-700" />
          <ellipse
            cx="200" cy="246.5" rx="11" ry="3.6" fill="none" strokeWidth="0.9"
            className="animate-ripple stroke-sky-50/90 dark:stroke-sky-600"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
          <ellipse
            cx="197" cy="247.5" rx="8" ry="2.6" fill="none" strokeWidth="0.8"
            className="animate-ripple stroke-sky-100/80 dark:stroke-sky-700"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '2s' }}
          />
        </g>

        {/* patinho no lago (morador fixo) */}
        <g transform="translate(206 244)" className="animate-bob">
          <ellipse cx="0" cy="0" rx="3.2" ry="2.2" className="fill-amber-300" />
          <circle cx="2.8" cy="-2.4" r="1.7" className="fill-amber-300" />
          <path d="M4.4 -2.4 l2 0.6 l-2 0.7 Z" className="fill-orange-500" />
          <circle cx="3.1" cy="-2.8" r="0.4" className="fill-slate-800" />
        </g>

        {/* cervo bebendo na beira do lago */}
        <g transform="translate(228 241)">
          <path d="M-3 2.6 v4 M0.5 2.6 v4 M3.4 2.4 v4 M5.6 2.2 v4" strokeWidth="1.1" strokeLinecap="round" className="stroke-amber-800 dark:stroke-amber-900" />
          <ellipse cx="1.4" cy="0" rx="5.4" ry="3" className="fill-amber-600 dark:fill-amber-700" />
          <path d="M6.4 -1.4 q2 -0.6 2.4 -2.4" strokeWidth="1.4" strokeLinecap="round" fill="none" className="stroke-amber-600 dark:stroke-amber-700" />
          <g className="animate-drink" style={{ transformBox: 'fill-box', transformOrigin: '100% 20%' }}>
            <path d="M-3.6 -1.6 L-8.4 1.2" strokeWidth="2.2" strokeLinecap="round" className="stroke-amber-600 dark:stroke-amber-700" />
            <ellipse cx="-9.4" cy="1.8" rx="2.1" ry="1.5" className="fill-amber-600 dark:fill-amber-700" />
            <circle cx="-9.8" cy="1.4" r="0.35" className="fill-slate-900" />
            <path d="M-8.6 -0.2 l-0.6 -2 M-9.6 0 l-1.4 -1.6" strokeWidth="0.7" strokeLinecap="round" className="stroke-amber-800" />
          </g>
          <circle cx="4.6" cy="-1.6" r="0.7" className="fill-orange-100" opacity="0.8" />
          <circle cx="2.2" cy="1" r="0.6" className="fill-orange-100" opacity="0.7" />
        </g>

        {/* peixinho saltando do lago */}
        <g transform="translate(193 243)">
          {/* opacity 0 na base: sem animação (movimento reduzido) o peixe fica submerso */}
          <g className="animate-fish" style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0 }}>
            <ellipse cx="0" cy="0" rx="2.6" ry="1.4" className="fill-orange-400" />
            <path d="M-2.2 0 l-2 -1.4 v2.8 Z" className="fill-orange-500" />
            <circle cx="1.4" cy="-0.4" r="0.35" className="fill-slate-900" />
          </g>
        </g>

        {/* esquilo na copa da árvore do mercado */}
        <g transform="translate(268 109)" className="animate-bob" style={{ animationDuration: '3.8s' }}>
          <path d="M2.2 -0.6 q3 -3.4 1 -5.6 q3.4 0.6 2.4 4.4 q-0.6 2 -2.6 2.4 Z" className="fill-amber-700 dark:fill-amber-800" />
          <ellipse cx="0" cy="0" rx="2.4" ry="2" className="fill-amber-600 dark:fill-amber-700" />
          <circle cx="-2" cy="-1.4" r="1.5" className="fill-amber-600 dark:fill-amber-700" />
          <path d="M-2.8 -2.6 l-0.4 -1.4 l1.2 0.8 Z" className="fill-amber-700" />
          <circle cx="-2.5" cy="-1.6" r="0.35" className="fill-slate-900" />
        </g>

        {/* abelhinha rondando as flores */}
        <g transform="translate(172 260) scale(0.65)">
          <g className="animate-flutter" style={{ animationDelay: '3s', animationDuration: '7s' }}>
            <ellipse cx="0" cy="0" rx="2" ry="1.4" className="fill-amber-400" />
            <path d="M-0.7 -1.3 v2.6 M0.7 -1.3 v2.6" strokeWidth="0.6" className="stroke-slate-900" />
            <ellipse cx="-0.4" cy="-1.8" rx="1.3" ry="0.8" className="fill-white/80" />
            <circle cx="1.7" cy="-0.3" r="0.3" className="fill-slate-900" />
          </g>
        </g>

        {/* caracol atravessando sem pressa nenhuma */}
        <g className="animate-walk" style={{ animationDuration: '160s' }}>
          <g transform="translate(0 291)">
            <path d="M-2.6 0 q2.6 1.4 6 0 l1.6 -1 q0.6 -0.8 0 -1.2 q-0.8 -0.4 -1.2 0.4 l-0.6 0.8" className="fill-stone-400 dark:fill-stone-500" />
            <path d="M3.6 -2.6 v-1.2 M4.8 -2.4 v-1.2" strokeWidth="0.5" strokeLinecap="round" className="stroke-stone-500" />
            <circle cx="0" cy="-1.6" r="2.2" className="fill-amber-600 dark:fill-amber-700" />
            <path d="M0 -1.6 a1.4 1.4 0 0 1 1.4 1.2 a0.8 0.8 0 0 1 -1.5 0.2" fill="none" strokeWidth="0.5" className="stroke-amber-900" />
          </g>
        </g>

        {/* cerquinha da casinha (o palácio dispensa cerca) */}
        {prog.house < 3 && (
          <g className="fill-amber-600/80 dark:fill-amber-950">
            <rect x="152" y="188" width="2.4" height="9" rx="1" />
            <rect x="159" y="187" width="2.4" height="10" rx="1" />
            <rect x="166" y="188" width="2.4" height="9" rx="1" />
            <rect x="152" y="190.5" width="17" height="1.6" rx="0.8" />
            <rect x="232" y="188" width="2.4" height="9" rx="1" />
            <rect x="239" y="187" width="2.4" height="10" rx="1" />
            <rect x="246" y="188" width="2.4" height="9" rx="1" />
            <rect x="232" y="190.5" width="17" height="1.6" rx="0.8" />
          </g>
        )}

        {/* árvores: copadas e pinheirinhos balançando ao vento */}
        <g>
          <g className="animate-sway" style={SWAY}>
            <rect x="138" y="128" width="4" height="10" className="fill-amber-800" />
            <circle cx="140" cy="121" r="9" className="fill-emerald-500 dark:fill-emerald-800" />
            <circle cx="134" cy="127" r="6" className="fill-emerald-400 dark:fill-emerald-700" />
            <circle cx="146" cy="126" r="5" className="fill-emerald-600 dark:fill-emerald-900" />
          </g>

          <g className="animate-sway" style={{ ...SWAY, animationDelay: '1.4s' }}>
            <rect x="262" y="126" width="4" height="10" className="fill-amber-800" />
            <circle cx="264" cy="119" r="9" className="fill-emerald-500 dark:fill-emerald-800" />
            <circle cx="270" cy="125" r="6" className="fill-emerald-400 dark:fill-emerald-700" />
          </g>

          {/* easter egg: monstrinho espiando atrás do pinheiro grande */}
          {egg === 'monster' && (
            <g transform="translate(24 128)">
              <g className="animate-peek">
                <circle cx="0" cy="0" r="5.2" className="fill-violet-500" />
                <path d="M-3.4 -3.8 l-1.6 -3 l3 0.8 Z M3.4 -3.8 l1.6 -3 l-3 0.8 Z" className="fill-violet-700" />
                <circle cx="-1.9" cy="-0.8" r="1.7" fill="#fff" />
                <circle cx="1.9" cy="-0.8" r="1.7" fill="#fff" />
                <circle cx="-1.9" cy="-0.6" r="0.8" className="fill-slate-900" />
                <circle cx="1.9" cy="-0.6" r="0.8" className="fill-slate-900" />
                <path d="M-1.6 2.2 q1.6 1.4 3.2 0" fill="none" strokeWidth="0.8" strokeLinecap="round" className="stroke-violet-900" />
              </g>
            </g>
          )}

          <g transform="translate(34 118)">
            <g className="animate-sway" style={{ ...SWAY, animationDelay: '0.7s' }}>
              <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
              <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
              <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
              <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
            </g>
          </g>
          <g transform="translate(370 122) scale(0.8)">
            <g className="animate-sway" style={{ ...SWAY, animationDelay: '2.1s' }}>
              <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
              <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
              <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
              <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
            </g>
          </g>
          <g transform="translate(148 246) scale(0.7)">
            <g className="animate-sway" style={{ ...SWAY, animationDelay: '1s' }}>
              <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
              <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
              <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
              <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
            </g>
          </g>
          <g transform="translate(252 258) scale(0.6)">
            <g className="animate-sway" style={{ ...SWAY, animationDelay: '2.8s' }}>
              <rect x="-2" y="14" width="4" height="8" className="fill-amber-800" />
              <circle cx="0" cy="6" r="10" className="fill-emerald-500 dark:fill-emerald-800" />
              <circle cx="-7" cy="11" r="6" className="fill-emerald-400 dark:fill-emerald-700" />
            </g>
          </g>

          {/* floresta cresce com o uso da vila */}
          {prog.nature >= 1 && (
            <g transform="translate(105 140) scale(0.55)">
              <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
              <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
              <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
              <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
            </g>
          )}
          {prog.nature >= 2 && (
            <g transform="translate(300 130) scale(0.75)">
              <rect x="-2" y="8" width="4" height="9" className="fill-amber-800" />
              <circle cx="0" cy="2" r="9" className="fill-emerald-500 dark:fill-emerald-800" />
              <circle cx="-6" cy="7" r="6" className="fill-emerald-400 dark:fill-emerald-700" />
              <circle cx="6" cy="6" r="5" className="fill-emerald-600 dark:fill-emerald-900" />
            </g>
          )}
          {prog.nature >= 3 && (
            <g transform="translate(14 168) scale(0.6)">
              <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
              <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
              <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
              <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
            </g>
          )}

          {/* moitas e tufos de grama */}
          <circle cx="30" cy="210" r="5" className="fill-emerald-500 dark:fill-emerald-800" />
          <circle cx="38" cy="213" r="4" className="fill-emerald-400 dark:fill-emerald-700" />
          <circle cx="368" cy="206" r="5" className="fill-emerald-500 dark:fill-emerald-800" />
          <circle cx="360" cy="209" r="4" className="fill-emerald-400 dark:fill-emerald-700" />
          <circle cx="120" cy="158" r="3.4" className="fill-emerald-500/80 dark:fill-emerald-800" />
          <circle cx="286" cy="156" r="3.4" className="fill-emerald-500/80 dark:fill-emerald-800" />
          <g fill="none" strokeWidth="1.2" strokeLinecap="round" className="animate-sway stroke-emerald-600/70 dark:stroke-emerald-700" style={{ ...SWAY, animationDelay: '0.4s', animationDuration: '3.2s' }}>
            <path d="M96 200 q1 -4 0 -6 M99 200 q2 -3 4 -4 M93 200 q-2 -3 -4 -4" />
            <path d="M304 196 q1 -4 0 -6 M307 196 q2 -3 4 -4 M301 196 q-2 -3 -4 -4" />
            <path d="M178 154 q1 -3.4 0 -5 M181 154 q1.8 -2.6 3.4 -3.4" />
          </g>

          {/* jardim vivo: murcha com atrasos, floresce com tudo em dia */}
          {BASE_FLOWERS.map(([cx, cy, color], i) => (
            <circle
              key={`f${i}`}
              cx={cx}
              cy={cy}
              r={garden === 'wilted' ? 1.4 : 2}
              className={garden === 'wilted' ? 'fill-slate-400/60' : color}
            />
          ))}
          {garden === 'blooming' &&
            EXTRA_FLOWERS.map(([cx, cy, color], i) => (
              <circle key={`x${i}`} cx={cx} cy={cy} r="2" className={color} />
            ))}
        </g>

        {/* Banco -> Contas */}
        <g transform="translate(70 150)" {...go({ route: '/contas', aria: 'Banco: abrir Contas' })}>
          <ellipse cx="0" cy="1" rx="30" ry="5" className="fill-emerald-700/15 dark:fill-black/30" />
          <rect x="-26" y="-4" width="52" height="5" rx="1.5" className="fill-slate-300 dark:fill-slate-600" />
          <rect x="-22" y="-30" width="44" height="26" className="fill-slate-100 dark:fill-slate-400" />
          <rect x="17" y="-30" width="5" height="26" className="fill-slate-300/80 dark:fill-slate-500" />
          <path d="M-26 -30 L0 -44 L26 -30 Z" className="fill-slate-200 dark:fill-slate-500" />
          <path d="M0 -44 L26 -30 L14 -30 Z" className="fill-slate-400/30 dark:fill-slate-600/50" />
          <circle cx="0" cy="-34" r="4" className="fill-amber-400" />
          {/* caixa atendendo entre as colunas */}
          <g>
            <circle cx="0" cy="-14.5" r="2" fill="#fcd9b8" />
            <path d="M-2 -15.6 a2 2 0 0 1 4 0 l-0.6 -0.4 h-2.8 Z" className="fill-slate-800" />
            <rect x="-2.4" y="-12.6" width="4.8" height="5.4" rx="1.4" className="fill-slate-600 dark:fill-slate-700" />
            <rect x="-3.4" y="-7.6" width="6.8" height="1.4" rx="0.7" className="fill-amber-700 dark:fill-amber-800" />
          </g>
          <rect x="-19" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          <rect x="-8" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          <rect x="3" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          <rect x="14" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          {/* nível 1: alas laterais */}
          {prog.bank >= 1 && (
            <>
              <rect x="-31" y="-22" width="9" height="18" rx="1" className="fill-slate-200 dark:fill-slate-500" />
              <rect x="22" y="-22" width="9" height="18" rx="1" className="fill-slate-200 dark:fill-slate-500" />
              <rect x="-28.5" y="-19" width="4" height="15" className="fill-white dark:fill-slate-300" />
              <rect x="24.5" y="-19" width="4" height="15" className="fill-white dark:fill-slate-300" />
            </>
          )}
          {/* nível 2: moeda dourada em destaque + topiarias */}
          {prog.bank >= 2 && (
            <>
              <circle cx="0" cy="-34" r="5.6" fill="none" strokeWidth="1.4" className="stroke-amber-500" />
              <circle cx="-34" cy="-1" r="3" className="fill-emerald-500 dark:fill-emerald-700" />
              <circle cx="34" cy="-1" r="3" className="fill-emerald-500 dark:fill-emerald-700" />
            </>
          )}
          {/* nível 3: fonte na esquina */}
          {prog.bank >= 3 && (
            <g transform="translate(42 -6)">
              <ellipse cx="0" cy="3" rx="7" ry="2.6" className="fill-sky-300 dark:fill-sky-800" />
              <rect x="-1.2" y="-4" width="2.4" height="6" className="fill-stone-400" />
              <circle cx="0" cy="-5" r="1.4" className="fill-sky-200 motion-safe:animate-pulse" />
              <circle cx="-2.6" cy="-3" r="0.9" className="fill-sky-200" opacity="0.8" />
              <circle cx="2.6" cy="-3" r="0.9" className="fill-sky-200" opacity="0.8" />
            </g>
          )}
          <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">Banco</text>
        </g>

        {/* Mercado -> Compras */}
        <g transform="translate(330 150)" {...go({ route: '/compras', aria: 'Mercado: abrir lista de compras' })}>
          <ellipse cx="0" cy="1" rx="30" ry="5" className="fill-emerald-700/15 dark:fill-black/30" />
          <rect x="-24" y="-26" width="48" height="26" rx="2" className="fill-emerald-50 dark:fill-slate-500" />
          <rect x="19" y="-26" width="5" height="26" rx="2" className="fill-emerald-200/80 dark:fill-slate-600/80" />
          <g>
            <rect x="-24" y="-32" width="8" height="10" rx="2" className="fill-emerald-500 dark:fill-emerald-600" />
            <rect x="-16" y="-32" width="8" height="10" rx="2" className="fill-white dark:fill-slate-300" />
            <rect x="-8" y="-32" width="8" height="10" rx="2" className="fill-emerald-500 dark:fill-emerald-600" />
            <rect x="0" y="-32" width="8" height="10" rx="2" className="fill-white dark:fill-slate-300" />
            <rect x="8" y="-32" width="8" height="10" rx="2" className="fill-emerald-500 dark:fill-emerald-600" />
            <rect x="16" y="-32" width="8" height="10" rx="2" className="fill-white dark:fill-slate-300" />
          </g>
          <rect x="-18" y="-17" width="16" height="10" rx="1" className={windowGlass} />
          {/* atendente no balcão da janela */}
          <g className="animate-bob" style={{ animationDuration: '3.4s' }}>
            <circle cx="-10" cy="-12.6" r="2.1" fill="#fcd9b8" />
            <path d="M-12.1 -13.4 a2.1 2.1 0 0 1 4.2 0 l-0.5 -0.6 h-3.2 Z" className="fill-amber-900" />
            <rect x="-12.6" y="-10.8" width="5.2" height="3.8" rx="1.3" className="fill-emerald-600 dark:fill-emerald-700" />
          </g>
          <rect x="-18" y="-7.4" width="16" height="1.2" className="fill-emerald-800/60" />
          <rect x="5" y="-15" width="12" height="15" rx="1" className="fill-emerald-700" />
          <circle cx="-14" cy="-4" r="2.5" className="fill-orange-400" />
          <circle cx="-9" cy="-3" r="2.5" className="fill-rose-400" />
          <circle cx="-11" cy="-7" r="2.5" className="fill-lime-400" />
          <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">Mercado</text>
        </g>

        {/* Casinha -> Tarefas do lar */}
        <g transform="translate(200 185)" {...go({ route: '/tarefas', aria: 'Nossa casinha: abrir tarefas do lar' })}>
          <ellipse cx="0" cy="2" rx="38" ry="6" className="fill-emerald-700/15 dark:fill-black/30" />
          {props.completedToday && (
            <g>
              <circle cx="20" cy="-58" r="3" className="fill-slate-300/80 motion-safe:animate-pulse" />
              <circle cx="24" cy="-65" r="2.4" className="fill-slate-300/60 motion-safe:animate-pulse" />
              <circle cx="27" cy="-71" r="1.8" className="fill-slate-300/40 motion-safe:animate-pulse" />
            </g>
          )}
          {prog.house >= 3 ? (
            <>
              {/* PALÁCIO: corpo central + duas torres com cones e bandeiras */}
              <ellipse cx="0" cy="2" rx="50" ry="6.5" className="fill-emerald-700/20 dark:fill-black/35" />
              <rect x="-42" y="-52" width="14" height="52" rx="1" fill="url(#vmWall)" />
              <rect x="28" y="-52" width="14" height="52" rx="1" fill="url(#vmWall)" />
              <rect x="-42" y="-52" width="3" height="52" className="fill-orange-200/80" />
              <rect x="39" y="-52" width="3" height="52" className="fill-orange-300/60" />
              <path d="M-45 -52 L-35 -71 L-25 -52 Z" fill="url(#vmRoof)" />
              <path d="M25 -52 L35 -71 L45 -52 Z" fill="url(#vmRoof)" />
              <circle cx="-35" cy="-71.5" r="1.6" fill="url(#vmGold)" />
              <circle cx="35" cy="-71.5" r="1.6" fill="url(#vmGold)" />
              <rect x="-35.5" y="-80" width="1" height="8" className="fill-stone-500" />
              <path d="M-34.5 -80 L-27.5 -77.6 L-34.5 -75.2 Z" className="fill-rose-400" />
              <rect x="34.5" y="-80" width="1" height="8" className="fill-stone-500" />
              <path d="M35.5 -80 L42.5 -77.6 L35.5 -75.2 Z" className="fill-sky-400" />
              <rect x="-38" y="-44" width="6" height="9" rx="3" className={windowGlass} />
              <rect x="32" y="-44" width="6" height="9" rx="3" className={windowGlass} />
              <rect x="-38" y="-26" width="6" height="9" rx="3" className={windowGlass} />
              <rect x="32" y="-26" width="6" height="9" rx="3" className={windowGlass} />
              <rect x="-27" y="-36" width="54" height="36" fill="url(#vmWall)" />
              <rect x="22" y="-36" width="5" height="36" className="fill-orange-300/50" />
              <path d="M-31 -36 L0 -57 L31 -36 Z" fill="url(#vmRoof)" />
              <path d="M0 -42 c-1.6 -3 -6 -2.4 -6 0.6 c0 2.4 3.8 4.4 6 6 c2.2 -1.6 6 -3.6 6 -6 c0 -3 -4.4 -3.6 -6 -0.6 Z" className="fill-rose-200" />
              <rect x="-19" y="-28" width="10" height="9" rx="1" className={windowGlass} />
              <rect x="9" y="-28" width="10" height="9" rx="1" className={windowGlass} />
              <rect x="-20" y="-18.5" width="12" height="1.6" rx="0.8" className="fill-amber-500" />
              <rect x="8" y="-18.5" width="12" height="1.6" rx="0.8" className="fill-amber-500" />
              <path d="M-7 0 v-11 a7 7 0 0 1 14 0 v11 Z" className="fill-amber-800 dark:fill-amber-900" />
              <circle cx="4" cy="-6" r="1.2" fill="url(#vmGold)" />
              <rect x="-12" y="0" width="24" height="3" rx="1" className="fill-stone-300 dark:fill-slate-600" />
            </>
          ) : (
            <>
              <rect x="16" y="-52" width="8" height="12" className="fill-rose-700 dark:fill-rose-800" />
              <rect x="-30" y="-34" width="60" height="34" rx="2" className="fill-orange-50 dark:fill-slate-500" />
              {/* faces sombreadas: profundidade */}
              <rect x="25" y="-34" width="5" height="34" className="fill-orange-200/70 dark:fill-slate-600/80" />
              <path d="M-36 -34 L0 -58 L36 -34 Z" className="fill-rose-500 dark:fill-rose-600" />
              <path d="M0 -58 L36 -34 L22 -34 Z" className="fill-rose-700/30 dark:fill-rose-900/40" />
              <path d="M0 -40 c-1.6 -3 -6 -2.4 -6 0.6 c0 2.4 3.8 4.4 6 6 c2.2 -1.6 6 -3.6 6 -6 c0 -3 -4.4 -3.6 -6 -0.6 Z" className="fill-rose-300 dark:fill-rose-400" />
              <rect x="-24" y="-26" width="11" height="9" rx="1" className={windowGlass} />
              <rect x="13" y="-26" width="11" height="9" rx="1" className={windowGlass} />
              <rect x="-7" y="-17" width="14" height="17" rx="2" className="fill-amber-700 dark:fill-amber-800" />
              <circle cx="3" cy="-8" r="1.2" className="fill-amber-300" />
              {/* nível 1: caixa de correio */}
              {prog.house >= 1 && (
                <g transform="translate(-44 0)">
                  <rect x="-0.8" y="-8" width="1.6" height="8" className="fill-amber-900" />
                  <rect x="-4" y="-13" width="8" height="5.5" rx="1.6" className="fill-rose-500 dark:fill-rose-600" />
                  <rect x="3" y="-15" width="1" height="4" className="fill-amber-400" />
                </g>
              )}
              {/* nível 2: sótão com janelinha */}
              {prog.house >= 2 && (
                <g transform="translate(-14 -46)">
                  <rect x="-5" y="0" width="10" height="8" className="fill-orange-50 dark:fill-slate-500" />
                  <path d="M-7 0 L0 -6 L7 0 Z" className="fill-rose-600 dark:fill-rose-700" />
                  <circle cx="0" cy="4" r="2.2" className={windowGlass} />
                </g>
              )}
            </>
          )}
          <text x="0" y="18" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">
            {prog.house >= 3 ? 'Nosso palácio' : 'Nossa casinha'}
          </text>
        </g>

        {/* Academia -> Treinos */}
        <g transform="translate(75 255)" {...go({ route: '/academia', aria: 'Academia: abrir treinos' })}>
          <ellipse cx="0" cy="1" rx="32" ry="5" className="fill-emerald-700/15 dark:fill-black/30" />
          <rect x="-26" y="-24" width="52" height="24" rx="2" className="fill-violet-100 dark:fill-slate-500" />
          <rect x="21" y="-24" width="5" height="24" rx="2" className="fill-violet-200 dark:fill-slate-600/80" />
          <rect x="-28" y="-29" width="56" height="6" rx="2" className="fill-violet-500 dark:fill-violet-600" />
          <rect x="-21" y="-22" width="3" height="8" rx="1" className="fill-slate-700 dark:fill-slate-800" />
          <rect x="-8" y="-22" width="3" height="8" rx="1" className="fill-slate-700 dark:fill-slate-800" />
          <rect x="-19" y="-19" width="12" height="2" className="fill-slate-700 dark:fill-slate-800" />
          <rect x="8" y="-19" width="12" height="8" rx="1" className={windowGlass} />
          <rect x="-6" y="-14" width="12" height="14" rx="1" className="fill-violet-700" />
          {/* maromba treinando ao lado da porta */}
          <g transform="translate(-15.5 0)">
            <path d="M-1.4 -2.2 l-0.7 2.2 M1.4 -2.2 l0.7 2.2" strokeWidth="1.5" strokeLinecap="round" className="stroke-slate-800 dark:stroke-slate-900" />
            <path d="M-3.2 -8.8 L3.2 -8.8 L2 -2 L-2 -2 Z" className="fill-rose-600 dark:fill-rose-700" />
            <circle cx="0" cy="-10.8" r="2.2" fill="#fcd9b8" />
            <path d="M-2.2 -11.4 a2.2 2.2 0 0 1 4.4 0 l-0.5 -0.7 h-3.4 Z" className="fill-slate-900" />
            <g className="animate-lift">
              <path d="M-2.8 -9.4 L-4.8 -13.2 M2.8 -9.4 L4.8 -13.2" strokeWidth="1.3" strokeLinecap="round" stroke="#fcd9b8" fill="none" />
              <rect x="-7.6" y="-14.6" width="15.2" height="1.3" rx="0.65" className="fill-slate-700 dark:fill-slate-300" />
              <circle cx="-7.8" cy="-14" r="2" className="fill-slate-500 dark:fill-slate-400" />
              <circle cx="7.8" cy="-14" r="2" className="fill-slate-500 dark:fill-slate-400" />
            </g>
          </g>
          {/* nível 1: bandeirola no teto */}
          {prog.gym >= 1 && (
            <>
              <rect x="-27" y="-40" width="1.4" height="11" className="fill-stone-500" />
              <path d="M-25.6 -40 L-17 -37 L-25.6 -34 Z" className="fill-violet-500 dark:fill-violet-400" />
            </>
          )}
          {/* nível 2: anexo com janela */}
          {prog.gym >= 2 && (
            <>
              <rect x="26" y="-16" width="14" height="16" rx="1.5" className="fill-violet-200 dark:fill-slate-600" />
              <rect x="25" y="-19" width="16" height="4" rx="1.5" className="fill-violet-500 dark:fill-violet-600" />
              <rect x="30" y="-12" width="6" height="5" rx="1" className={windowGlass} />
            </>
          )}
          {/* nível 3: segundo andar */}
          {prog.gym >= 3 && (
            <>
              <rect x="-16" y="-42" width="32" height="13" rx="1.5" className="fill-violet-100 dark:fill-slate-500" />
              <rect x="-18" y="-46" width="36" height="5" rx="2" className="fill-violet-500 dark:fill-violet-600" />
              <rect x="-6" y="-39" width="12" height="7" rx="1" className={windowGlass} />
            </>
          )}
          <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">Academia</text>
        </g>

        {/* Pracinha -> Agenda */}
        <g transform="translate(325 255)" {...go({ route: '/agenda', aria: 'Pracinha: abrir agenda' })}>
          <ellipse cx="0" cy="1" rx="32" ry="5" className="fill-emerald-700/15 dark:fill-black/30" />
          <ellipse cx="0" cy="0" rx="26" ry="5" className="fill-stone-300 dark:fill-slate-600" />
          <rect x="-18" y="-22" width="3" height="22" className="fill-stone-400 dark:fill-stone-500" />
          <rect x="15" y="-22" width="3" height="22" className="fill-stone-400 dark:fill-stone-500" />
          <rect x="-8" y="-9" width="16" height="3" rx="1" className="fill-amber-800" />
          <rect x="-7" y="-6" width="2" height="5" className="fill-amber-900" />
          <rect x="5" y="-6" width="2" height="5" className="fill-amber-900" />
          <path d="M-24 -22 L0 -38 L24 -22 Z" className="fill-violet-400 dark:fill-violet-500" />
          <rect x="-0.7" y="-47" width="1.4" height="9" className="fill-stone-500" />
          <path d="M0 -47 L10 -44 L0 -41 Z" className="fill-rose-400" />
          {/* nível 1: bandeirinhas entre os postes */}
          {prog.park >= 1 && (
            <g>
              <path d="M-16.5 -20 Q0 -13 16.5 -20" fill="none" strokeWidth="0.9" className="stroke-stone-400" />
              <path d="M-11 -17.6 l3.2 0.4 l-1.8 3.4 Z" className="fill-rose-400" />
              <path d="M-4 -15.6 l3.2 0.2 l-1.7 3.4 Z" className="fill-amber-400" />
              <path d="M3 -15.5 l3.2 -0.2 l-1.5 3.5 Z" className="fill-sky-400" />
              <path d="M10 -17 l3.2 -0.5 l-1.3 3.6 Z" className="fill-violet-400" />
            </g>
          )}
          <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">
            {prog.park >= 3 ? 'Grande parque' : 'Pracinha'}
          </text>
        </g>

        {/* pracinha nível 1+: balanço ao lado do coreto */}
        {prog.park >= 1 && (
          <g transform="translate(285 262)" className="stroke-amber-800 dark:stroke-amber-900">
            <path d="M-9 0 L-5 -13 M-1 0 L-5 -13 M7 0 L11 -13 M15 0 L11 -13 M-5 -13 L11 -13" fill="none" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M1 -13 v7 M5 -13 v7" fill="none" strokeWidth="0.9" />
            <rect x="0" y="-6" width="6" height="1.8" rx="0.6" className="fill-amber-700 dark:fill-amber-800" stroke="none" />
          </g>
        )}
        {/* pracinha nível 2+: mais um patinho (filhote) */}
        {prog.park >= 2 && (
          <g transform="translate(196 249) scale(0.7)" className="animate-bob" style={{ animationDelay: '1.2s' }}>
            <ellipse cx="0" cy="0" rx="3.2" ry="2.2" className="fill-amber-200" />
            <circle cx="-2.8" cy="-2.4" r="1.7" className="fill-amber-200" />
            <path d="M-4.4 -2.4 l-2 0.6 l2 0.7 Z" className="fill-orange-500" />
            <circle cx="-3.1" cy="-2.8" r="0.4" className="fill-slate-800" />
          </g>
        )}
        {/* pracinha nível 3: vira GRANDE PARQUE — escorregador, carrossel e roda-gigante */}
        {prog.park >= 3 && (
          <>
            <g transform="translate(300 274)">
              <rect x="-1" y="-11" width="2" height="11" className="fill-stone-400" />
              <path d="M-4 -9 h6 M-4 -6 h6 M-4 -3 h6" fill="none" strokeWidth="0.9" className="stroke-stone-500" />
              <path d="M0 -10 C7 -7 9 -3 14 1 L9 2 C5 -1 3 -4 -1 -7 Z" className="fill-sky-400 dark:fill-sky-600" />
            </g>
            <g transform="translate(262 256)">
              <ellipse cx="0" cy="1" rx="8" ry="2.6" className="fill-stone-300 dark:fill-slate-600" />
              <rect x="-0.7" y="-16" width="1.4" height="17" className="fill-stone-500" />
              <path d="M-9 -12 L0 -21 L9 -12 Z" fill="url(#vmGold)" />
              <path d="M-9 -12 L-4.5 -16.5 L0 -12 Z M0 -12 L4.5 -16.5 L9 -12 Z" className="fill-rose-400" />
              <circle cx="-4" cy="-6" r="1.6" className="fill-violet-400" />
              <circle cx="4" cy="-7.5" r="1.6" className="fill-sky-400" />
            </g>
            <g transform="translate(369 224)">
              <path d="M0 0 L-7 25 M0 0 L7 25" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-stone-500" />
              <g
                className="motion-safe:animate-[spin_18s_linear_infinite]"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              >
                <circle cx="0" cy="0" r="13" fill="none" strokeWidth="1.4" className="stroke-stone-400 dark:stroke-stone-500" />
                <path d="M0 -13 V13 M-13 0 H13 M-9.2 -9.2 L9.2 9.2 M-9.2 9.2 L9.2 -9.2" strokeWidth="0.9" className="stroke-stone-400/80 dark:stroke-stone-500" />
                <circle cx="0" cy="-13" r="2" className="fill-rose-400" />
                <circle cx="13" cy="0" r="2" className="fill-sky-400" />
                <circle cx="0" cy="13" r="2" className="fill-amber-400" />
                <circle cx="-13" cy="0" r="2" className="fill-violet-400" />
                <circle cx="9.2" cy="-9.2" r="2" className="fill-emerald-400" />
                <circle cx="-9.2" cy="9.2" r="2" className="fill-orange-400" />
              </g>
              <circle cx="0" cy="0" r="1.6" className="fill-stone-500" />
            </g>
          </>
        )}

        {/* borboleta: moradora fixa; mais bichinhos chegam com a vila */}
        <g transform="translate(158 158)" className="animate-flutter">
          <ellipse cx="-1.6" cy="-1" rx="2" ry="1.4" transform="rotate(-28)" className="fill-rose-400" />
          <ellipse cx="1.6" cy="-1" rx="2" ry="1.4" transform="rotate(28)" className="fill-rose-300" />
          <rect x="-0.4" y="-2" width="0.8" height="4" rx="0.4" className="fill-slate-700 dark:fill-slate-300" />
        </g>
        {prog.nature >= 2 && (
          <g transform="translate(191 124)" className="animate-bob">
            <circle cx="0" cy="0" r="2.6" className="fill-sky-500" />
            <circle cx="2" cy="-1" r="1.7" className="fill-sky-400" />
            <path d="M3.5 -1.2 l1.8 0.5 l-1.8 0.6 Z" className="fill-amber-500" />
            <path d="M-2.4 0.4 l-2.4 1.2 l2.2 0.6 Z" className="fill-sky-600" />
            <circle cx="2.4" cy="-1.5" r="0.4" className="fill-slate-900" />
          </g>
        )}
        {prog.nature >= 3 && (
          <>
            <g transform="translate(156 203)">
              <g className="animate-tail">
                <path d="M4.5 -1 q4.5 -1.5 3.5 -6" fill="none" strokeWidth="1.4" strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-400" />
              </g>
              <ellipse cx="0" cy="0" rx="4.6" ry="3" className="fill-slate-700 dark:fill-slate-400" />
              <circle cx="-4.4" cy="-3" r="2.6" className="fill-slate-700 dark:fill-slate-400" />
              <path d="M-6.4 -5 l1 -2 l1.4 1.6 Z M-3.6 -5.4 l1.2 -1.8 l1 2 Z" className="fill-slate-700 dark:fill-slate-400" />
              <circle cx="-5.2" cy="-3.2" r="0.4" className="fill-amber-300" />
              <circle cx="-3.4" cy="-3.2" r="0.4" className="fill-amber-300" />
            </g>
            <g transform="translate(345 220)">
              <ellipse cx="0" cy="0" rx="3.2" ry="2.4" className="fill-white dark:fill-slate-200" />
              <circle cx="-2.8" cy="-1.6" r="1.8" className="fill-white dark:fill-slate-200" />
              <ellipse cx="-3.6" cy="-4" rx="0.8" ry="2" className="fill-white dark:fill-slate-200" />
              <ellipse cx="-2" cy="-4.2" rx="0.8" ry="2" className="fill-white dark:fill-slate-200" />
              <circle cx="-3.2" cy="-1.8" r="0.35" className="fill-slate-800" />
              <circle cx="2.8" cy="0.6" r="1" className="fill-slate-100" />
            </g>
          </>
        )}
        {/* vagalumes nas noites secas */}
        {phase === 'night' && !rainy &&
          [
            [120, 202, '0s'], [252, 192, '1.6s'], [178, 232, '3.1s'], [312, 212, '4.4s'], [84, 178, '5.7s'], [356, 188, '2.4s'],
          ].map(([x, y, delay], i) => (
            <circle
              key={`ff${i}`}
              cx={x as number}
              cy={y as number}
              r="1.3"
              className="animate-firefly fill-amber-300"
              style={{ animationDelay: delay as string }}
            />
          ))}

        {/* decoração sazonal */}
        {season === 'junina' && (
          <g>
            <path d="M70 104 Q135 136 200 126" fill="none" strokeWidth="0.9" className="stroke-stone-500/80" />
            <path d="M200 126 Q265 136 330 116" fill="none" strokeWidth="0.9" className="stroke-stone-500/80" />
            {[
              [92, 113, 'fill-rose-400'], [116, 120, 'fill-amber-400'], [140, 124, 'fill-sky-400'], [166, 126, 'fill-violet-400'],
              [232, 130, 'fill-amber-400'], [258, 130, 'fill-rose-400'], [284, 127, 'fill-emerald-400'], [308, 122, 'fill-sky-400'],
            ].map(([x, y, color], i) => (
              <path key={`jn${i}`} d={`M${x} ${y} l6.4 0 l-3.2 7 Z`} className={color as string} />
            ))}
          </g>
        )}
        {season === 'natal' && (
          <g>
            <path d="M34 103 l1.8 3.6 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6 Z" fill="url(#vmGold)" />
            <circle cx="28" cy="118" r="1.3" className="fill-rose-400 motion-safe:animate-pulse" />
            <circle cx="40" cy="122" r="1.3" className="fill-sky-400 motion-safe:animate-pulse" style={{ animationDelay: '0.5s' }} />
            <circle cx="30" cy="128" r="1.3" className="fill-amber-300 motion-safe:animate-pulse" style={{ animationDelay: '1s' }} />
            <circle cx="42" cy="132" r="1.3" className="fill-emerald-300 motion-safe:animate-pulse" style={{ animationDelay: '1.5s' }} />
            <circle cx="200" cy="170.5" r="2.8" fill="none" strokeWidth="1.5" className="stroke-emerald-600" />
            <circle cx="200" cy="173.6" r="0.9" className="fill-rose-500" />
          </g>
        )}
        {season === 'halloween' && (
          <g transform="translate(212 183)">
            <ellipse cx="0" cy="0" rx="3.4" ry="2.8" className="fill-orange-500" />
            <rect x="-0.7" y="-4" width="1.4" height="1.6" rx="0.5" className="fill-emerald-700" />
            <path d="M-1.6 -0.8 l1 1 l-2 0 Z M1.6 -0.8 l-1 1 l2 0 Z M-1.4 1.2 q1.4 1 2.8 0" className="fill-slate-900" />
          </g>
        )}

        {/* easter egg: alienzinho visitando */}
        {egg === 'alien' && (
          <g transform="translate(38 264)" className="animate-bob">
            <rect x="-2.6" y="1" width="5.2" height="6" rx="2" className="fill-lime-500" />
            <ellipse cx="0" cy="-3" rx="4" ry="4.4" className="fill-lime-400" />
            <ellipse cx="-1.7" cy="-3.4" rx="1.3" ry="1.8" className="fill-slate-900" />
            <ellipse cx="1.7" cy="-3.4" rx="1.3" ry="1.8" className="fill-slate-900" />
            <path d="M0 -7.4 v-2.4" strokeWidth="0.8" className="stroke-lime-600" />
            <circle cx="0" cy="-10.4" r="1" className="fill-rose-400 motion-safe:animate-pulse" />
            <path d="M-2.6 3 l-2.6 -1.6 M2.6 3 l2.6 -1.6" strokeWidth="1" strokeLinecap="round" className="stroke-lime-500" />
          </g>
        )}

        {/* easter egg: alguém passando pela vila */}
        {egg === 'walker' && (
          <g className="animate-walk">
            <g transform="translate(0 282)">
              <circle cx="0" cy="0" r="2.6" fill="#fcd9b8" />
              <path d="M-1.6 -1 a2.6 2.6 0 0 1 3.2 -1.4 l-0.4 1.2 Z" className="fill-amber-900" />
              <rect x="-2.2" y="2.4" width="4.4" height="7" rx="2" className="fill-sky-600" />
              <path d="M-1.2 9.4 l-1 4.4 M1.2 9.4 l1 4.4" strokeWidth="1.6" strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-400" />
              <path d="M2.2 4.4 l2.6 2" strokeWidth="1.3" strokeLinecap="round" className="stroke-sky-600" />
              {/* cachorrinho na coleira */}
              <path d="M4.8 6.4 L9 10.2" strokeWidth="0.6" className="stroke-slate-500" fill="none" />
              <g transform="translate(11 11.2)">
                <g className="animate-tail">
                  <path d="M-3 -0.6 q-2 -1 -1.6 -3" fill="none" strokeWidth="1" strokeLinecap="round" className="stroke-amber-800" />
                </g>
                <ellipse cx="0" cy="0" rx="3" ry="1.8" className="fill-amber-700" />
                <circle cx="3" cy="-1.4" r="1.6" className="fill-amber-700" />
                <path d="M2.2 -2.8 l-0.3 -1.3 l1.2 0.7 Z M4 -2.7 l0.5 -1.3 l0.7 1.1 Z" className="fill-amber-900" />
                <circle cx="3.5" cy="-1.6" r="0.32" className="fill-slate-900" />
                <path d="M-1.6 1.6 v1.6 M1.6 1.6 v1.6" strokeWidth="1" strokeLinecap="round" className="stroke-amber-800" />
              </g>
            </g>
          </g>
        )}
        {/* chuva obedecendo à previsão */}
        {rainy &&
          Array.from({ length: 16 }, (_, i) => {
            const x = 12 + i * 25 + (i % 3) * 6;
            return (
              <path
                key={`rd${i}`}
                d={`M${x} 0 l-3 11`}
                strokeWidth="1.1"
                strokeLinecap="round"
                className="rain-drop animate-rain stroke-sky-500/70 dark:stroke-sky-300/50"
                style={{ animationDelay: `${(i % 8) * 0.14}s`, animationDuration: `${1 + (i % 4) * 0.15}s` }}
              />
            );
          })}
      </svg>

      {/* plaquinhas com dados ao vivo */}
      <span className={`${chipClass} ${balanceTone}`} style={{ left: '17.5%', top: '33%' }}>{balanceText}</span>
      <span className={`${chipClass} text-slate-600 dark:text-slate-300`} style={{ left: '82.5%', top: '35%' }}>
        {props.marketCount} {props.marketCount === 1 ? 'item' : 'itens'}
      </span>
      <span className={`${chipClass} ${houseChip.tone}`} style={{ left: '50%', top: '39%' }}>{houseChip.text}</span>
      <span className={`${chipClass} text-slate-600 dark:text-slate-300`} style={{ left: '81.25%', top: '68%' }}>{eventText}</span>
      {props.progress && (
        <span className={`${chipClass} text-brand-600 dark:text-brand-400`} style={{ left: '15%', top: '13%' }}>
          vila nível {villageLevel + 1}
        </span>
      )}
    </div>
  );
}
