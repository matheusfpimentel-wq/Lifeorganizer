/**
 * Modo Viagem — porta de embarque (V0).
 * O aeroporto da vila leva para cá. A V1 (moedas, orçamento e resumo) está
 * planejada em docs/travel-mode-plan.md; por ora a página apresenta o modo e
 * dá o atalho para pausar as rotinas do lar (Modo férias).
 */
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';

const RUNWAY: { title: string; text: string }[] = [
  {
    title: 'Gastos em outra moeda',
    text: 'Lance despesas em dólar, euro ou pesos e o app converte para reais na hora, congelando a taxa do dia.',
  },
  {
    title: 'Orçamento da viagem',
    text: 'Definam quanto querem gastar e acompanhem a barrinha enchendo dia a dia, sem sustos na volta.',
  },
  {
    title: 'Resumo e acerto final',
    text: 'No fim, um resumo bonito: total, por dia, por categoria, quem pagou o quê — e o acerto em um Pix.',
  },
  {
    title: 'Checklist de mala',
    text: 'Lista de mala compartilhada, no mesmo esquema da lista de compras que vocês já usam.',
  },
];

export default function TravelPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* cena do aeroporto */}
      <header className="relative overflow-hidden rounded-3xl shadow-md">
        <svg viewBox="0 0 400 92" className="h-24 w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
          <rect width="400" height="92" className="fill-sky-200 dark:fill-slate-800" />
          <circle cx="330" cy="26" r="12" className="fill-amber-300 dark:fill-amber-100" />
          <g className="animate-drift fill-white dark:opacity-20" opacity="0.9">
            <ellipse cx="90" cy="30" rx="24" ry="9" />
            <ellipse cx="230" cy="42" rx="18" ry="7" />
          </g>
          {/* avião decolando */}
          <g className="animate-bob" style={{ animationDuration: '4s' }}>
            <g transform="translate(150 40) rotate(-8)">
              <ellipse cx="0" cy="0" rx="20" ry="5" className="fill-white dark:fill-slate-300" />
              <path d="M14 -1 L22 -1 L18 3 Z" className="fill-rose-500" />
              <path d="M-2 -1 L-12 -12 L-5 -1 Z" className="fill-rose-400" />
              <path d="M-2 1 L-12 12 L-5 1 Z" className="fill-rose-400" />
              <path d="M-16 -1 L-22 -7 L-18 0 Z" className="fill-rose-500" />
              {[0, 1, 2, 3].map((i) => (
                <circle key={i} cx={-8 + i * 5} cy="-1.4" r="1" className="fill-sky-300" />
              ))}
            </g>
          </g>
          <rect y="74" width="400" height="18" className="fill-slate-400 dark:fill-slate-700" />
          <path d="M20 83 h30 M70 83 h30 M120 83 h30 M170 83 h30 M220 83 h30 M270 83 h30 M320 83 h30" strokeWidth="2" strokeDasharray="12 12" className="stroke-white/80" />
          <rect y="52" width="400" height="40" fill="url(#travelScrim)" />
          <defs>
            <linearGradient id="travelScrim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.38" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-3 bottom-2">
          <h1 className="text-2xl font-bold text-white drop-shadow-md">Modo Viagem</h1>
        </div>
      </header>

      <section className="card flex flex-col gap-2">
        <p className="font-bold">✈️ Portão de embarque em construção!</p>
        <p className="text-sm text-slate-500">
          O Modo Viagem está na pista de decolagem. Quando ficar pronto, ativar uma viagem vai
          transformar o app no quartel-general de vocês dois fora de casa:
        </p>
      </section>

      <ul className="flex flex-col gap-3">
        {RUNWAY.map((item, i) => (
          <li key={item.title} className="card flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/10 font-bold text-brand-600 dark:bg-brand-400/15 dark:text-brand-400">
              {i + 1}
            </span>
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-slate-500">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <section className="card flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Icon.Sun className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold">Vai viajar agora?</h2>
        </div>
        <p className="text-sm text-slate-500">
          O <strong>Modo férias</strong> já existe e pausa as rotinas do lar até a volta — nada de
          tarefa acumulando enquanto vocês estiverem fora.
        </p>
        <Link to="/configuracoes" className="btn-primary">
          Ativar Modo férias nas Configurações
        </Link>
      </section>
    </div>
  );
}
