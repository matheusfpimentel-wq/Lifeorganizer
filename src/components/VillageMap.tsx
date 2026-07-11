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
}

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

        {/* céu */}
        <rect width="400" height="300" className="fill-sky-100 dark:fill-slate-950" />

        {/* sol (dia) */}
        <g className="dark:hidden">
          <circle cx="346" cy="44" r="24" className="fill-amber-200" opacity="0.6" />
          <circle cx="346" cy="44" r="15" className="fill-amber-300" />
        </g>

        {/* lua e estrelas (noite) */}
        <g className="hidden dark:inline">
          <circle cx="346" cy="44" r="14" className="fill-amber-100" />
          <circle cx="341" cy="40" r="3" className="fill-amber-200" opacity="0.7" />
          <circle cx="350" cy="49" r="2" className="fill-amber-200" opacity="0.7" />
          <circle cx="60" cy="36" r="1.5" className="fill-white motion-safe:animate-pulse" />
          <circle cx="120" cy="58" r="1.2" className="fill-white" opacity="0.8" />
          <circle cx="210" cy="30" r="1.5" className="fill-white motion-safe:animate-pulse" />
          <circle cx="270" cy="62" r="1.2" className="fill-white" opacity="0.7" />
          <circle cx="30" cy="80" r="1.2" className="fill-white" opacity="0.8" />
        </g>

        {/* nuvens */}
        <g className="fill-white dark:opacity-10" opacity="0.9">
          <ellipse cx="90" cy="46" rx="26" ry="10" />
          <ellipse cx="112" cy="40" rx="18" ry="8" />
          <ellipse cx="235" cy="66" rx="22" ry="8" opacity="0.7" />
        </g>

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

        {/* laguinho */}
        <g>
          <ellipse cx="200" cy="247" rx="19" ry="6.5" className="fill-sky-300 dark:fill-sky-900" />
          <ellipse cx="200" cy="246" rx="14" ry="4.5" className="fill-sky-200 dark:fill-sky-800" />
          <path d="M192 245 q3 -1.5 6 0 q3 1.5 6 0" fill="none" strokeWidth="0.8" className="stroke-sky-400 dark:stroke-sky-700" />
        </g>

        {/* cerquinha da casinha */}
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

        {/* árvores: copadas e pinheirinhos, espalhadas sem simetria */}
        <g>
          <rect x="138" y="128" width="4" height="10" className="fill-amber-800" />
          <circle cx="140" cy="121" r="9" className="fill-emerald-500 dark:fill-emerald-800" />
          <circle cx="134" cy="127" r="6" className="fill-emerald-400 dark:fill-emerald-700" />
          <circle cx="146" cy="126" r="5" className="fill-emerald-600 dark:fill-emerald-900" />

          <rect x="262" y="126" width="4" height="10" className="fill-amber-800" />
          <circle cx="264" cy="119" r="9" className="fill-emerald-500 dark:fill-emerald-800" />
          <circle cx="270" cy="125" r="6" className="fill-emerald-400 dark:fill-emerald-700" />

          <g transform="translate(34 118)">
            <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
            <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
            <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
            <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
          </g>
          <g transform="translate(370 122) scale(0.8)">
            <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
            <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
            <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
            <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
          </g>
          <g transform="translate(148 246) scale(0.7)">
            <rect x="-1.7" y="16" width="3.4" height="7" className="fill-amber-900" />
            <path d="M0 -12 L10 4 L-10 4 Z" className="fill-emerald-600 dark:fill-emerald-900" />
            <path d="M0 -4 L12 12 L-12 12 Z" className="fill-emerald-500 dark:fill-emerald-800" />
            <path d="M0 4 L14 18 L-14 18 Z" className="fill-emerald-400 dark:fill-emerald-700" />
          </g>
          <g transform="translate(252 258) scale(0.6)">
            <rect x="-2" y="14" width="4" height="8" className="fill-amber-800" />
            <circle cx="0" cy="6" r="10" className="fill-emerald-500 dark:fill-emerald-800" />
            <circle cx="-7" cy="11" r="6" className="fill-emerald-400 dark:fill-emerald-700" />
          </g>

          {/* moitas e tufos de grama */}
          <circle cx="30" cy="210" r="5" className="fill-emerald-500 dark:fill-emerald-800" />
          <circle cx="38" cy="213" r="4" className="fill-emerald-400 dark:fill-emerald-700" />
          <circle cx="368" cy="206" r="5" className="fill-emerald-500 dark:fill-emerald-800" />
          <circle cx="360" cy="209" r="4" className="fill-emerald-400 dark:fill-emerald-700" />
          <circle cx="120" cy="158" r="3.4" className="fill-emerald-500/80 dark:fill-emerald-800" />
          <circle cx="286" cy="156" r="3.4" className="fill-emerald-500/80 dark:fill-emerald-800" />
          <g fill="none" strokeWidth="1.2" strokeLinecap="round" className="stroke-emerald-600/70 dark:stroke-emerald-700">
            <path d="M96 200 q1 -4 0 -6 M99 200 q2 -3 4 -4 M93 200 q-2 -3 -4 -4" />
            <path d="M304 196 q1 -4 0 -6 M307 196 q2 -3 4 -4 M301 196 q-2 -3 -4 -4" />
            <path d="M178 154 q1 -3.4 0 -5 M181 154 q1.8 -2.6 3.4 -3.4" />
          </g>

          {/* florzinhas */}
          <circle cx="162" cy="266" r="2" className="fill-rose-400" />
          <circle cx="171" cy="271" r="2" className="fill-amber-400" />
          <circle cx="236" cy="268" r="2" className="fill-rose-400" />
          <circle cx="228" cy="273" r="2" className="fill-violet-400" />
          <circle cx="58" cy="182" r="1.8" className="fill-rose-400" />
          <circle cx="64" cy="186" r="1.8" className="fill-amber-400" />
          <circle cx="342" cy="186" r="1.8" className="fill-violet-400" />
          <circle cx="348" cy="182" r="1.8" className="fill-rose-400" />
        </g>

        {/* Banco -> Contas */}
        <g transform="translate(70 150)" {...go({ route: '/contas', aria: 'Banco: abrir Contas' })}>
          <ellipse cx="0" cy="1" rx="30" ry="5" className="fill-emerald-700/15 dark:fill-black/30" />
          <rect x="-26" y="-4" width="52" height="5" rx="1.5" className="fill-slate-300 dark:fill-slate-600" />
          <rect x="-22" y="-30" width="44" height="26" className="fill-slate-100 dark:fill-slate-400" />
          <path d="M-26 -30 L0 -44 L26 -30 Z" className="fill-slate-200 dark:fill-slate-500" />
          <circle cx="0" cy="-34" r="4" className="fill-amber-400" />
          <rect x="-19" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          <rect x="-8" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          <rect x="3" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          <rect x="14" y="-26" width="5" height="21" className="fill-white dark:fill-slate-300" />
          <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">Banco</text>
        </g>

        {/* Mercado -> Compras */}
        <g transform="translate(330 150)" {...go({ route: '/compras', aria: 'Mercado: abrir lista de compras' })}>
          <ellipse cx="0" cy="1" rx="30" ry="5" className="fill-emerald-700/15 dark:fill-black/30" />
          <rect x="-24" y="-26" width="48" height="26" rx="2" className="fill-emerald-50 dark:fill-slate-500" />
          <g>
            <rect x="-24" y="-32" width="8" height="10" rx="2" className="fill-emerald-500 dark:fill-emerald-600" />
            <rect x="-16" y="-32" width="8" height="10" rx="2" className="fill-white dark:fill-slate-300" />
            <rect x="-8" y="-32" width="8" height="10" rx="2" className="fill-emerald-500 dark:fill-emerald-600" />
            <rect x="0" y="-32" width="8" height="10" rx="2" className="fill-white dark:fill-slate-300" />
            <rect x="8" y="-32" width="8" height="10" rx="2" className="fill-emerald-500 dark:fill-emerald-600" />
            <rect x="16" y="-32" width="8" height="10" rx="2" className="fill-white dark:fill-slate-300" />
          </g>
          <rect x="-18" y="-17" width="16" height="10" rx="1" className="fill-sky-200 dark:fill-amber-200" />
          <rect x="5" y="-15" width="12" height="15" rx="1" className="fill-emerald-700" />
          <circle cx="-14" cy="-4" r="2.5" className="fill-orange-400" />
          <circle cx="-9" cy="-3" r="2.5" className="fill-rose-400" />
          <circle cx="-11" cy="-7" r="2.5" className="fill-lime-400" />
          <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">Mercado</text>
        </g>

        {/* Casinha -> Tarefas do lar */}
        <g transform="translate(200 185)" {...go({ route: '/tarefas', aria: 'Nossa casinha: abrir tarefas do lar' })}>
          <ellipse cx="0" cy="2" rx="38" ry="6" className="fill-emerald-700/15 dark:fill-black/30" />
          <circle cx="20" cy="-58" r="3" className="fill-slate-300/80 motion-safe:animate-pulse" />
          <circle cx="24" cy="-65" r="2.4" className="fill-slate-300/60 motion-safe:animate-pulse" />
          <rect x="16" y="-52" width="8" height="12" className="fill-rose-700 dark:fill-rose-800" />
          <rect x="-30" y="-34" width="60" height="34" rx="2" className="fill-orange-50 dark:fill-slate-500" />
          <path d="M-36 -34 L0 -58 L36 -34 Z" className="fill-rose-500 dark:fill-rose-600" />
          <path d="M0 -40 c-1.6 -3 -6 -2.4 -6 0.6 c0 2.4 3.8 4.4 6 6 c2.2 -1.6 6 -3.6 6 -6 c0 -3 -4.4 -3.6 -6 -0.6 Z" className="fill-rose-300 dark:fill-rose-400" />
          <rect x="-24" y="-26" width="11" height="9" rx="1" className="fill-sky-200 dark:fill-amber-200" />
          <rect x="13" y="-26" width="11" height="9" rx="1" className="fill-sky-200 dark:fill-amber-200" />
          <rect x="-7" y="-17" width="14" height="17" rx="2" className="fill-amber-700 dark:fill-amber-800" />
          <circle cx="3" cy="-8" r="1.2" className="fill-amber-300" />
          <text x="0" y="18" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">Nossa casinha</text>
        </g>

        {/* Academia -> Treinos */}
        <g transform="translate(75 255)" {...go({ route: '/academia', aria: 'Academia: abrir treinos' })}>
          <ellipse cx="0" cy="1" rx="32" ry="5" className="fill-emerald-700/15 dark:fill-black/30" />
          <rect x="-26" y="-24" width="52" height="24" rx="2" className="fill-violet-100 dark:fill-slate-500" />
          <rect x="-28" y="-29" width="56" height="6" rx="2" className="fill-violet-500 dark:fill-violet-600" />
          <rect x="-21" y="-22" width="3" height="8" rx="1" className="fill-slate-700 dark:fill-slate-800" />
          <rect x="-8" y="-22" width="3" height="8" rx="1" className="fill-slate-700 dark:fill-slate-800" />
          <rect x="-19" y="-19" width="12" height="2" className="fill-slate-700 dark:fill-slate-800" />
          <rect x="8" y="-19" width="12" height="8" rx="1" className="fill-sky-200 dark:fill-amber-200" />
          <rect x="-6" y="-14" width="12" height="14" rx="1" className="fill-violet-700" />
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
          <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-slate-600 dark:fill-slate-300">Pracinha</text>
        </g>
      </svg>

      {/* plaquinhas com dados ao vivo */}
      <span className={`${chipClass} ${balanceTone}`} style={{ left: '17.5%', top: '33%' }}>{balanceText}</span>
      <span className={`${chipClass} text-slate-600 dark:text-slate-300`} style={{ left: '82.5%', top: '35%' }}>
        {props.marketCount} {props.marketCount === 1 ? 'item' : 'itens'}
      </span>
      <span className={`${chipClass} ${houseChip.tone}`} style={{ left: '50%', top: '39%' }}>{houseChip.text}</span>
      <span className={`${chipClass} text-slate-600 dark:text-slate-300`} style={{ left: '81.25%', top: '68%' }}>{eventText}</span>
    </div>
  );
}
