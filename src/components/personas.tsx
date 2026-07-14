/**
 * Personas de corpo inteiro dos moradores — o personagem TODO segue o tema do
 * avatar escolhido (mago de túnica, astronauta de traje, panda peludo…), sem o
 * fundo circular do avatar. Base dos pés em y=0, altura ~24 unidades.
 * Uso dentro de SVGs (VillageMap, banners): <MiniPersona slug="mago" />.
 */
import type { CSSProperties } from 'react';

const SKIN = '#fcd9b8';
const LEG_STYLE: CSSProperties = { transformBox: 'fill-box', transformOrigin: '50% 0%' };

function Legs({ stroke, walking, run }: { stroke: string; walking?: boolean; run?: boolean }) {
  const cls = (side: 'a' | 'b') =>
    walking ? (run ? `animate-leg-${side}-run` : `animate-leg-${side}`) : '';
  return (
    <>
      <path d="M-1.5 -6 L-2 0" strokeWidth="1.9" strokeLinecap="round" stroke={stroke} fill="none" className={cls('a')} style={walking ? LEG_STYLE : undefined} />
      <path d="M1.5 -6 L2 0" strokeWidth="1.9" strokeLinecap="round" stroke={stroke} fill="none" className={cls('b')} style={walking ? LEG_STYLE : undefined} />
    </>
  );
}

function Face({ cy = -18, eyeColor = '#1e293b' }: { cy?: number; eyeColor?: string }) {
  return (
    <>
      <circle cx={-1.5} cy={cy} r="0.55" fill={eyeColor} />
      <circle cx={1.5} cy={cy} r="0.55" fill={eyeColor} />
      <path d={`M-1.2 ${cy + 2.4} q1.2 1 2.4 0`} fill="none" strokeWidth="0.6" strokeLinecap="round" stroke="#b45309" />
    </>
  );
}

/** Corpo genérico (fallback sem avatar): camiseta na cor do membro. */
function Generic({ color, walking, run }: { color: string; walking?: boolean; run?: boolean }) {
  return (
    <>
      <Legs stroke="#334155" walking={walking} run={run} />
      <path d="M-3.4 -14 h6.8 l-1 8 h-4.8 Z" fill={color} />
      <path d="M-3.4 -13 l-2 4 M3.4 -13 l2 4" strokeWidth="1.4" strokeLinecap="round" stroke={color} fill="none" />
      <circle cx="0" cy="-18" r="4.2" fill={SKIN} />
      <path d="M-4.2 -19 a4.2 4.2 0 0 1 8.4 0 l-1 -1.6 h-6.4 Z" fill="#78350f" />
      <Face />
    </>
  );
}

/** Persona completa por slug do avatar. */
export function MiniPersona({
  slug,
  color,
  walking,
  run,
}: {
  slug?: string | null;
  color?: string | null;
  walking?: boolean;
  run?: boolean;
}) {
  const fallback = color ?? '#0ea5e9';
  switch (slug) {
    case 'mago':
      return (
        <>
          <Legs stroke="#312e81" walking={walking} run={run} />
          <path d="M-3 -14 L3 -14 L4.4 -5.4 L-4.4 -5.4 Z" fill="#6d28d9" />
          <path d="M-3 -13 l-2.2 4.4 M3 -13 l2.2 4.4" strokeWidth="1.4" strokeLinecap="round" stroke="#6d28d9" fill="none" />
          <circle cx="0" cy="-17.6" r="4" fill={SKIN} />
          <path d="M-4.6 -19 L0 -28 L4.6 -19 c-1.6 1 -7.6 1 -9.2 0 Z" fill="#312e81" />
          <path d="M-5.6 -18.6 c2 1.4 9.2 1.4 11.2 0 l0.7 1.1 c-2.6 1.7 -10 1.7 -12.6 0 Z" fill="#4338ca" />
          <circle cx="1.6" cy="-24" r="0.55" fill="#fde047" />
          <circle cx="-1.2" cy="-22" r="0.4" fill="#fde047" />
          <Face cy={-17.2} />
          <path d="M4.6 -10 v-6" strokeWidth="0.8" strokeLinecap="round" stroke="#92400e" />
          <circle cx="4.6" cy="-16.8" r="0.9" fill="#fde047" className="motion-safe:animate-pulse" />
        </>
      );
    case 'feiticeira':
      return (
        <>
          <Legs stroke="#134e4a" walking={walking} run={run} />
          <path d="M-3 -14 L3 -14 L4.6 -5.4 L-4.6 -5.4 Z" fill="#0f766e" />
          <path d="M-3 -13 l-2.2 4.4 M3 -13 l2.2 4.4" strokeWidth="1.4" strokeLinecap="round" stroke="#0f766e" fill="none" />
          <circle cx="0" cy="-17.6" r="4" fill={SKIN} />
          <path d="M-4.4 -19 L0 -27.4 L4.4 -19 Z" fill="#134e4a" />
          <rect x="-1.4" y="-24.4" width="2.8" height="1.1" rx="0.5" fill="#f59e0b" />
          <path d="M-5.8 -18.6 c2.2 1.4 9.4 1.4 11.6 0 l0.7 1.1 c-2.8 1.7 -10.2 1.7 -13 0 Z" fill="#115e59" />
          <Face cy={-17.2} />
        </>
      );
    case 'piloto':
      return (
        <>
          <Legs stroke="#7f1d1d" walking={walking} run={run} />
          <path d="M-3.2 -14 h6.4 l-0.8 8.6 h-4.8 Z" fill="#dc2626" />
          <path d="M-3.2 -13 l-2 4.2 M3.2 -13 l2 4.2" strokeWidth="1.4" strokeLinecap="round" stroke="#dc2626" fill="none" />
          <circle cx="0" cy="-18" r="4.2" fill={SKIN} />
          <path d="M-4.2 -18.6 a4.2 4.2 0 0 1 8.4 0 Z" fill="#f8fafc" />
          <rect x="-3.6" y="-19.6" width="7.2" height="2" rx="1" fill="#0ea5e9" opacity="0.85" />
          <circle cx="0" cy="-22" r="0.8" fill="#e11d48" />
          <Face cy={-16.8} />
        </>
      );
    case 'aviador':
      return (
        <>
          <Legs stroke="#57534e" walking={walking} run={run} />
          <path d="M-3.4 -14 h6.8 l-0.9 8.6 h-5 Z" fill="#92400e" />
          <path d="M-3.4 -13 l-2.1 4.2 M3.4 -13 l2.1 4.2" strokeWidth="1.5" strokeLinecap="round" stroke="#92400e" fill="none" />
          <path d="M-2.6 -13.6 h5.2 l-0.4 2 h-4.4 Z" fill="#fde68a" />
          <circle cx="0" cy="-18" r="4.2" fill={SKIN} />
          <path d="M-4.2 -18.4 a4.2 4.2 0 0 1 8.4 0 l0 1 h-8.4 Z" fill="#78350f" />
          <rect x="-3.4" y="-19.8" width="6.8" height="1.8" rx="0.9" fill="#fbbf24" opacity="0.9" />
          <Face cy={-16.6} />
        </>
      );
    case 'cogumelo':
      return (
        <>
          <Legs stroke="#9a3412" walking={walking} run={run} />
          <path d="M-3.2 -13.6 h6.4 l-0.8 8.2 h-4.8 Z" fill="#f8fafc" />
          <path d="M-3.2 -12.8 l-2 4 M3.2 -12.8 l2 4" strokeWidth="1.4" strokeLinecap="round" stroke="#f8fafc" fill="none" />
          <circle cx="0" cy="-16.8" r="3.8" fill={SKIN} />
          <path d="M-6 -17.4 a6 4.6 0 0 1 12 0 c-2.4 1.2 -9.6 1.2 -12 0 Z" fill="#dc2626" />
          <circle cx="-2.8" cy="-20" r="1" fill="#fff" />
          <circle cx="2.4" cy="-21" r="1.2" fill="#fff" />
          <circle cx="0" cy="-18.6" r="0.8" fill="#fff" />
          <Face cy={-16.4} />
        </>
      );
    case 'dino':
      return (
        <>
          <Legs stroke="#15803d" walking={walking} run={run} />
          <path d="M-3.6 -14 h7.2 l-1 8.6 h-5.2 Z" fill="#22c55e" />
          <ellipse cx="0" cy="-10" rx="2" ry="2.8" fill="#bbf7d0" />
          <path d="M3.4 -8 q4 0.6 4.6 3.4 l-2.4 -0.6 q-1.6 -1.2 -2.6 -1.6 Z" fill="#22c55e" />
          <circle cx="0" cy="-17.8" r="4.2" fill="#22c55e" />
          <path d="M-1 -22 l1 -1.6 l1 1.6 Z M1.6 -21.4 l1 -1.4 l0.8 1.6 Z" fill="#15803d" />
          <circle cx="-1.4" cy="-18.2" r="0.6" fill="#052e16" />
          <circle cx="1.4" cy="-18.2" r="0.6" fill="#052e16" />
          <path d="M-1 -15.6 q1 0.8 2 0" fill="none" strokeWidth="0.6" strokeLinecap="round" stroke="#052e16" />
        </>
      );
    case 'fantasminha':
      return (
        <>
          <path d="M-4 -6 q0 -14 4 -14 q4 0 4 14 q-1.4 -1.6 -2.7 0 q-1.3 1.6 -2.6 0 q-1.3 1.6 -2.7 0 Z" fill="#f8fafc" opacity="0.95" transform="translate(0 -2)" />
          <circle cx="-1.5" cy="-15.5" r="0.7" fill="#0f172a" />
          <circle cx="1.5" cy="-15.5" r="0.7" fill="#0f172a" />
          <ellipse cx="0" cy="-13" rx="0.9" ry="1.2" fill="#0f172a" opacity="0.7" />
        </>
      );
    case 'robo':
      return (
        <>
          <Legs stroke="#475569" walking={walking} run={run} />
          <rect x="-3.4" y="-14" width="6.8" height="8.6" rx="1.2" fill="#94a3b8" />
          <rect x="-2.2" y="-12" width="4.4" height="3" rx="0.6" fill="#38bdf8" />
          <path d="M-3.4 -13 l-2.2 3.6 M3.4 -13 l2.2 3.6" strokeWidth="1.5" strokeLinecap="round" stroke="#94a3b8" fill="none" />
          <rect x="-3.6" y="-22" width="7.2" height="7" rx="1.6" fill="#cbd5e1" />
          <rect x="-2.4" y="-20.4" width="1.8" height="1.8" rx="0.4" fill="#0ea5e9" />
          <rect x="0.6" y="-20.4" width="1.8" height="1.8" rx="0.4" fill="#0ea5e9" />
          <path d="M-1.4 -16.9 h2.8" strokeWidth="0.7" strokeLinecap="round" stroke="#475569" />
          <path d="M0 -22 v-1.6" strokeWidth="0.7" stroke="#475569" />
          <circle cx="0" cy="-24.4" r="0.9" fill="#f43f5e" className="motion-safe:animate-pulse" />
        </>
      );
    case 'princesa':
      return (
        <>
          <path d="M0 -14 L5.4 -5.2 L-5.4 -5.2 Z" fill="#ec4899" />
          <path d="M-2 -5.2 l-0.4 5.2 M2 -5.2 l0.4 5.2" strokeWidth="1.6" strokeLinecap="round" stroke="#be185d" fill="none" />
          <path d="M-2.6 -13 l-2.2 4 M2.6 -13 l2.2 4" strokeWidth="1.3" strokeLinecap="round" stroke="#ec4899" fill="none" />
          <circle cx="0" cy="-17.6" r="4" fill={SKIN} />
          <path d="M-4 -18.4 a4 4 0 0 1 8 0 q1 2.6 1.6 4 l-2.4 -1 q-0.6 -1.6 -1 -2.4 q-3 1 -4.4 0 q-0.4 0.8 -1 2.4 l-2.4 1 q0.6 -1.4 1.6 -4 Z" fill="#a16207" />
          <path d="M-2.4 -21.6 l1 1.4 1.4 -1.8 1.4 1.8 1 -1.4 v1.8 c-1.6 1 -3.2 1 -4.8 0 Z" fill="#fde047" />
          <Face cy={-17.2} />
        </>
      );
    case 'astronauta':
      return (
        <>
          <Legs stroke="#cbd5e1" walking={walking} run={run} />
          <rect x="-3.6" y="-14" width="7.2" height="8.6" rx="2.2" fill="#e2e8f0" />
          <rect x="-2.2" y="-12.4" width="4.4" height="2.6" rx="0.8" fill="#94a3b8" />
          <path d="M-3.6 -13 l-2.2 4 M3.6 -13 l2.2 4" strokeWidth="1.7" strokeLinecap="round" stroke="#e2e8f0" fill="none" />
          <circle cx="0" cy="-18.6" r="4.6" fill="#e2e8f0" />
          <circle cx="0" cy="-18.4" r="3.2" fill="#38bdf8" />
          <path d="M-2 -19.6 a3.2 3.2 0 0 1 3.4 -1" fill="none" strokeWidth="0.8" strokeLinecap="round" stroke="#bae6fd" />
        </>
      );
    case 'gato':
      return (
        <>
          <Legs stroke="#92400e" walking={walking} run={run} />
          <path d="M-3.2 -14 h6.4 l-0.8 8.6 h-4.8 Z" fill="#f59e0b" />
          <ellipse cx="0" cy="-10.4" rx="1.8" ry="2.6" fill="#fef3c7" />
          <path d="M3 -7 q3.6 -0.4 4 -4" fill="none" strokeWidth="1.3" strokeLinecap="round" stroke="#f59e0b" className="animate-tail" />
          <circle cx="0" cy="-18" r="4.2" fill="#f59e0b" />
          <path d="M-3.8 -20.6 l-0.8 -3 l2.6 1.6 Z M3.8 -20.6 l0.8 -3 l-2.6 1.6 Z" fill="#92400e" />
          <circle cx="-1.5" cy="-18.4" r="0.6" fill="#1c1917" />
          <circle cx="1.5" cy="-18.4" r="0.6" fill="#1c1917" />
          <path d="M0 -16.8 l-0.7 0.9 h1.4 Z" fill="#fda4af" />
          <path d="M-3.6 -16.6 l-2 0.3 M-3.6 -15.8 l-2 0.6 M3.6 -16.6 l2 0.3 M3.6 -15.8 l2 0.6" strokeWidth="0.4" stroke="#fef3c7" />
        </>
      );
    case 'coruja':
      return (
        <>
          <Legs stroke="#f59e0b" walking={walking} run={run} />
          <ellipse cx="0" cy="-10.5" rx="4" ry="5" fill="#a16207" />
          <ellipse cx="0" cy="-9.6" rx="2.4" ry="3.4" fill="#fef3c7" />
          <path d="M-3.8 -13 q-2.4 2.4 -1.6 5.6 l1.8 -1.4 Z M3.8 -13 q2.4 2.4 1.6 5.6 l-1.8 -1.4 Z" fill="#854d0e" />
          <circle cx="0" cy="-17.6" r="4.2" fill="#a16207" />
          <path d="M-3.4 -20.6 l1.4 1.6 M3.4 -20.6 l-1.4 1.6" strokeWidth="1.1" strokeLinecap="round" stroke="#78350f" />
          <circle cx="-1.6" cy="-18" r="1.7" fill="#fef3c7" />
          <circle cx="1.6" cy="-18" r="1.7" fill="#fef3c7" />
          <circle cx="-1.6" cy="-18" r="0.7" fill="#1c1917" />
          <circle cx="1.6" cy="-18" r="0.7" fill="#1c1917" />
          <path d="M0 -16.6 l-0.8 1.1 h1.6 Z" fill="#f59e0b" />
        </>
      );
    case 'ninja':
      return (
        <>
          <Legs stroke="#0f172a" walking={walking} run={run} />
          <path d="M-3.2 -14 h6.4 l-0.8 8.6 h-4.8 Z" fill="#1e293b" />
          <path d="M-3.2 -13 l-2 4.2 M3.2 -13 l2 4.2" strokeWidth="1.4" strokeLinecap="round" stroke="#1e293b" fill="none" />
          <path d="M-1 -9.4 h2 l1.6 1.4 -1.2 1 -1.4 -1.2 -1.4 1.2 -1.2 -1 Z" fill="#dc2626" />
          <circle cx="0" cy="-18" r="4.2" fill="#0f172a" />
          <rect x="-3.8" y="-19.4" width="7.6" height="2.6" rx="1.3" fill={SKIN} />
          <circle cx="-1.5" cy="-18.2" r="0.6" fill="#0f172a" />
          <circle cx="1.5" cy="-18.2" r="0.6" fill="#0f172a" />
          <path d="M4 -20 l3 -1.6 M4 -19 l3 0.4" strokeWidth="0.8" strokeLinecap="round" stroke="#dc2626" />
        </>
      );
    case 'pirata':
      return (
        <>
          <Legs stroke="#1e293b" walking={walking} run={run} />
          <path d="M-3.4 -14 h6.8 l-0.9 8.6 h-5 Z" fill="#1e293b" />
          <path d="M-3.4 -10.4 h6.8 l-0.2 1.6 h-6.4 Z" fill="#dc2626" />
          <path d="M-3.4 -13 l-2.1 4.2 M3.4 -13 l2.1 4.2" strokeWidth="1.5" strokeLinecap="round" stroke="#1e293b" fill="none" />
          <circle cx="0" cy="-17.8" r="4" fill={SKIN} />
          <path d="M-5.4 -18.6 C-4.6 -23.6 4.6 -23.6 5.4 -18.6 l-1 0.8 c-2.6 -1.6 -6.2 -1.6 -8.8 0 Z" fill="#1e293b" />
          <path d="M-5.4 -18.6 q5.4 -2 10.8 0" fill="none" strokeWidth="0.7" stroke="#f8fafc" />
          <path d="M-4 -18.4 L3.4 -16.6" strokeWidth="0.7" stroke="#1e293b" />
          <circle cx="-1.5" cy="-17.6" r="1.2" fill="#1e293b" />
          <circle cx="1.6" cy="-17.4" r="0.6" fill="#1e293b" />
          <path d="M-0.6 -14.8 q1.4 1 2.6 0" fill="none" strokeWidth="0.6" strokeLinecap="round" stroke="#b45309" />
          <circle cx="4.2" cy="-15.4" r="0.8" fill="#fde047" />
        </>
      );
    case 'fada':
      return (
        <>
          <ellipse cx="-3.6" cy="-13" rx="2.6" ry="4" fill="#f0fdfa" opacity="0.9" transform="rotate(-20 -3.6 -13)" />
          <ellipse cx="3.6" cy="-13" rx="2.6" ry="4" fill="#f0fdfa" opacity="0.9" transform="rotate(20 3.6 -13)" />
          <path d="M0 -14 L4.6 -5.2 L-4.6 -5.2 Z" fill="#4ade80" />
          <path d="M-1.8 -5.2 l-0.4 5.2 M1.8 -5.2 l0.4 5.2" strokeWidth="1.5" strokeLinecap="round" stroke="#166534" fill="none" />
          <circle cx="0" cy="-17.6" r="4" fill={SKIN} />
          <path d="M-4 -18.4 a4 4 0 0 1 8 0 q0.8 2 1.4 3.2 l-2.2 -0.8 q-0.6 -1.4 -1 -2 q-2.8 1 -4.4 0 q-0.4 0.6 -1 2 l-2.2 0.8 q0.6 -1.2 1.4 -3.2 Z" fill="#fb7185" />
          <Face cy={-17.2} />
          <path d="M4.4 -10.4 l2.4 -3.4" strokeWidth="0.7" strokeLinecap="round" stroke="#92400e" />
          <path d="M6.8 -14.6 l0.5 1.1 1.2 0.2 -0.9 0.8 0.2 1.2 -1 -0.6 -1 0.6 0.2 -1.2 -0.9 -0.8 1.2 -0.2 Z" fill="#fde047" className="motion-safe:animate-pulse" />
        </>
      );
    case 'vampiro':
      return (
        <>
          <path d="M-5.6 -14 L0 -3.4 L5.6 -14 L3.4 -12.4 L0 -14.6 L-3.4 -12.4 Z" fill="#1e1b4b" />
          <Legs stroke="#1e1b4b" walking={walking} run={run} />
          <path d="M-3 -14 h6 l-0.8 8.2 h-4.4 Z" fill="#312e81" />
          <path d="M-3.4 -14.4 l1.6 2 M3.4 -14.4 l-1.6 2" strokeWidth="1" stroke="#f8fafc" />
          <circle cx="0" cy="-18" r="4" fill="#f1f5f9" />
          <path d="M-4 -19 C-3.6 -23.2 3.6 -23.2 4 -19 l-2 -1.4 -2 1 -2 -1 Z" fill="#0f172a" />
          <circle cx="-1.4" cy="-18" r="0.6" fill="#dc2626" />
          <circle cx="1.4" cy="-18" r="0.6" fill="#dc2626" />
          <path d="M-1.2 -16 q1.2 0.9 2.4 0" fill="none" strokeWidth="0.5" strokeLinecap="round" stroke="#7f1d1d" />
          <path d="M-0.9 -15.8 l0.3 1 0.4 -0.9 Z M0.6 -15.8 l0.3 0.9 0.4 -1 Z" fill="#f8fafc" />
        </>
      );
    case 'panda':
      return (
        <>
          <Legs stroke="#1c1917" walking={walking} run={run} />
          <path d="M-3.4 -14 h6.8 l-0.9 8.6 h-5 Z" fill="#f8fafc" />
          <path d="M-3.4 -13 l-2.1 4 M3.4 -13 l2.1 4" strokeWidth="1.7" strokeLinecap="round" stroke="#1c1917" fill="none" />
          <circle cx="0" cy="-18" r="4.4" fill="#f8fafc" />
          <circle cx="-3.2" cy="-21.4" r="1.5" fill="#1c1917" />
          <circle cx="3.2" cy="-21.4" r="1.5" fill="#1c1917" />
          <ellipse cx="-1.6" cy="-18.2" rx="1.2" ry="1.5" fill="#1c1917" transform="rotate(-12 -1.6 -18.2)" />
          <ellipse cx="1.6" cy="-18.2" rx="1.2" ry="1.5" fill="#1c1917" transform="rotate(12 1.6 -18.2)" />
          <circle cx="-1.5" cy="-18.3" r="0.45" fill="#f8fafc" />
          <circle cx="1.5" cy="-18.3" r="0.45" fill="#f8fafc" />
          <ellipse cx="0" cy="-15.8" rx="0.9" ry="0.6" fill="#1c1917" />
        </>
      );
    case 'sereia':
      return (
        <>
          <path d="M-2.6 -6.5 q-3.4 3 -5.4 2.4 q1.4 2.6 4.6 1.6 L-1 -1.6 q1.6 -3 0.6 -5.6 Z" fill="#0d9488" />
          <path d="M-2.8 -13.6 q3.6 -1.4 5.6 0 q1.6 3.8 -0.4 8 q-2.6 1.2 -4.6 0 q-1.6 -4.4 -0.6 -8 Z" fill="#14b8a6" />
          <path d="M-2 -10.6 h4 M-1.8 -8.4 h3.6" strokeWidth="0.5" stroke="#0f766e" />
          <circle cx="0" cy="-17.4" r="4" fill={SKIN} />
          <path d="M-4 -18.2 c-0.4 -5 8.4 -5 8 0 q0.8 2.6 2 4.4 l-2.6 -1.2 q-0.8 -1.6 -1.2 -2.6 q-3 1 -4.4 0 q-1.4 1 -2.2 2.6 l-2.6 1.2 q1.6 -1.8 3 -4.4 Z" fill="#dc2626" />
          <path d="M0 -23.4 l0.6 1.2 1.3 0.2 -0.9 0.9 0.2 1.3 -1.2 -0.6 -1.2 0.6 0.2 -1.3 -0.9 -0.9 1.3 -0.2 Z" fill="#fde047" />
          <Face cy={-17} />
        </>
      );
    default:
      return <Generic color={fallback} walking={walking} run={run} />;
  }
}
