import type { SVGProps } from 'react';

/**
 * Avatares embutidos, 100% originais e vetoriais, inspirados em universos de
 * fantasia/jogos/corrida (sem personagens protegidos por direitos autorais).
 * O slug é salvo em profiles.avatar; ausência de slug cai na inicial colorida.
 */

type P = SVGProps<SVGSVGElement>;

function frame(props: P, bg: string, children: React.ReactNode) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden {...props}>
      <circle cx="24" cy="24" r="24" fill={bg} />
      {children}
    </svg>
  );
}

export const AVATARS: Record<string, { label: string; render: (p: P) => JSX.Element }> = {
  mago: {
    label: 'Mago',
    render: (p) =>
      frame(p, '#6d28d9', (
        <>
          <circle cx="24" cy="28" r="10" fill="#fcd9b8" />
          <path d="M24 30c-4 0-8 2-8 6v2c2.5 2 13.5 2 16 0v-2c0-4-4-6-8-6Z" fill="#f8fafc" />
          <path d="M10 22 L24 4 L38 22 c-5 3-23 3-28 0Z" fill="#312e81" />
          <path d="M8 21c6 4 26 4 32 0l2 3c-8 5-28 5-36 0Z" fill="#4338ca" />
          <circle cx="30" cy="12" r="1.3" fill="#fde047" />
          <circle cx="20" cy="15" r="1" fill="#fde047" />
          <circle cx="20.5" cy="27" r="1.4" fill="#1e293b" />
          <circle cx="27.5" cy="27" r="1.4" fill="#1e293b" />
          <path d="M21 32q3 2 6 0" stroke="#b45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  feiticeira: {
    label: 'Feiticeira',
    render: (p) =>
      frame(p, '#0f766e', (
        <>
          <path d="M12 34c0-8 5-12 12-12s12 4 12 12v4H12Z" fill="#7c2d12" />
          <circle cx="24" cy="27" r="9" fill="#fcd9b8" />
          <path d="M9 20 L24 6 L39 20 c-6 3-24 3-30 0Z" fill="#134e4a" />
          <path d="M7 19c7 4 27 4 34 0l2 3c-9 5-29 5-38 0Z" fill="#115e59" />
          <rect x="21" y="12" width="6" height="3" rx="1" fill="#f59e0b" />
          <circle cx="21" cy="26" r="1.4" fill="#1e293b" />
          <circle cx="27" cy="26" r="1.4" fill="#1e293b" />
          <path d="M21.5 30.5q2.5 2 5 0" stroke="#b45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  piloto: {
    label: 'Piloto maluco',
    render: (p) =>
      frame(p, '#dc2626', (
        <>
          <circle cx="24" cy="26" r="12" fill="#f8fafc" />
          <path d="M12 26a12 12 0 0 1 24 0Z" fill="#e11d48" />
          <rect x="21" y="10" width="6" height="6" rx="2" fill="#e11d48" />
          <rect x="12" y="22" width="24" height="8" rx="4" fill="#0ea5e9" opacity="0.9" />
          <rect x="14" y="24" width="9" height="4" rx="2" fill="#bae6fd" />
          <rect x="25" y="24" width="9" height="4" rx="2" fill="#bae6fd" />
          <path d="M20 34q4 3 8 0" stroke="#9f1239" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  aviador: {
    label: 'Cão aviador',
    render: (p) =>
      frame(p, '#0284c7', (
        <>
          <path d="M10 22c-2-6 2-10 5-9l4 5Z" fill="#92400e" />
          <path d="M38 22c2-6-2-10-5-9l-4 5Z" fill="#92400e" />
          <circle cx="24" cy="27" r="12" fill="#b45309" />
          <circle cx="24" cy="31" r="7" fill="#fbbf24" />
          <ellipse cx="24" cy="29" rx="2.6" ry="2" fill="#1c1917" />
          <path d="M24 31v3M24 34q-2 1.5-4 0M24 34q2 1.5 4 0" stroke="#1c1917" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          <rect x="13" y="16" width="22" height="6" rx="3" fill="#78350f" />
          <circle cx="19" cy="19" r="3.4" fill="#e2e8f0" stroke="#78350f" strokeWidth="1.4" />
          <circle cx="29" cy="19" r="3.4" fill="#e2e8f0" stroke="#78350f" strokeWidth="1.4" />
        </>
      )),
  },
  cogumelo: {
    label: 'Cogumelo',
    render: (p) =>
      frame(p, '#fef3c7', (
        <>
          <path d="M8 24c0-10 7-16 16-16s16 6 16 16c0 2-1.5 3-3 3H11c-1.5 0-3-1-3-3Z" fill="#ef4444" />
          <circle cx="16" cy="17" r="3" fill="#fff" />
          <circle cx="28" cy="13" r="3.6" fill="#fff" />
          <circle cx="35" cy="20" r="2.4" fill="#fff" />
          <path d="M15 27h18v6a9 9 0 0 1-18 0Z" fill="#fde68a" />
          <circle cx="20.5" cy="31" r="1.4" fill="#1e293b" />
          <circle cx="27.5" cy="31" r="1.4" fill="#1e293b" />
          <path d="M21 34.5q3 2 6 0" stroke="#b45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  dino: {
    label: 'Dino',
    render: (p) =>
      frame(p, '#a7f3d0', (
        <>
          <path d="M24 6l3 5-6 1Zm7 4l3 5-6 0Z" fill="#059669" />
          <circle cx="24" cy="27" r="13" fill="#10b981" />
          <ellipse cx="24" cy="33" rx="8" ry="6" fill="#d1fae5" />
          <circle cx="19.5" cy="24" r="1.6" fill="#064e3b" />
          <circle cx="28.5" cy="24" r="1.6" fill="#064e3b" />
          <circle cx="21" cy="32" r="1" fill="#065f46" />
          <circle cx="27" cy="32" r="1" fill="#065f46" />
          <path d="M19 29q5 3 10 0" stroke="#065f46" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  fantasminha: {
    label: 'Fantasminha',
    render: (p) =>
      frame(p, '#4338ca', (
        <>
          <path d="M12 40V24a12 12 0 0 1 24 0v16l-4-3-4 3-4-3-4 3Z" fill="#f8fafc" />
          <circle cx="19.5" cy="24" r="2" fill="#1e293b" />
          <circle cx="28.5" cy="24" r="2" fill="#1e293b" />
          <ellipse cx="24" cy="30" rx="2" ry="2.6" fill="#1e293b" opacity="0.75" />
          <circle cx="14" cy="12" r="1" fill="#c7d2fe" />
          <circle cx="36" cy="14" r="1.2" fill="#c7d2fe" />
        </>
      )),
  },
  robo: {
    label: 'Robô',
    render: (p) =>
      frame(p, '#334155', (
        <>
          <rect x="12" y="16" width="24" height="20" rx="5" fill="#cbd5e1" />
          <rect x="16" y="22" width="7" height="6" rx="2" fill="#22d3ee" />
          <rect x="25" y="22" width="7" height="6" rx="2" fill="#22d3ee" />
          <rect x="18" y="31" width="12" height="2.4" rx="1.2" fill="#64748b" />
          <rect x="22.8" y="8" width="2.4" height="8" fill="#94a3b8" />
          <circle cx="24" cy="8" r="2.4" fill="#f43f5e" />
          <rect x="8" y="22" width="4" height="8" rx="2" fill="#94a3b8" />
          <rect x="36" y="22" width="4" height="8" rx="2" fill="#94a3b8" />
        </>
      )),
  },
  princesa: {
    label: 'Princesa',
    render: (p) =>
      frame(p, '#fbcfe8', (
        <>
          <path d="M12 36c0-8 4-14 12-14s12 6 12 14v2H12Z" fill="#f59e0b" />
          <circle cx="24" cy="24" r="9" fill="#fcd9b8" />
          <path d="M13 24c0-8 4-13 11-13s11 5 11 13c-2-4-4-6-6-6-1.5 2-8.5 2-10 0-2 0-4 2-6 6Z" fill="#a16207" />
          <path d="M17 11l2.5 3 4.5-4 4.5 4 2.5-3v4c-3 2-11 2-14 0Z" fill="#fde047" />
          <circle cx="21" cy="23" r="1.4" fill="#1e293b" />
          <circle cx="27" cy="23" r="1.4" fill="#1e293b" />
          <path d="M21.5 27.5q2.5 2 5 0" stroke="#b45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  astronauta: {
    label: 'Astronauta',
    render: (p) =>
      frame(p, '#0f172a', (
        <>
          <circle cx="10" cy="10" r="1" fill="#e2e8f0" />
          <circle cx="38" cy="8" r="1.2" fill="#e2e8f0" />
          <circle cx="40" cy="36" r="1" fill="#e2e8f0" />
          <circle cx="24" cy="26" r="14" fill="#e2e8f0" />
          <circle cx="24" cy="26" r="10" fill="#38bdf8" />
          <path d="M17 22a10 10 0 0 1 11-3" stroke="#bae6fd" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="18" y="38" width="12" height="4" rx="2" fill="#94a3b8" />
        </>
      )),
  },
  gato: {
    label: 'Gato',
    render: (p) =>
      frame(p, '#f59e0b', (
        <>
          <path d="M12 20 L14 8 L22 15Z" fill="#78350f" />
          <path d="M36 20 L34 8 L26 15Z" fill="#78350f" />
          <circle cx="24" cy="27" r="13" fill="#92400e" />
          <circle cx="19.5" cy="24" r="1.8" fill="#fef3c7" />
          <circle cx="28.5" cy="24" r="1.8" fill="#fef3c7" />
          <circle cx="19.5" cy="24" r="0.9" fill="#1c1917" />
          <circle cx="28.5" cy="24" r="0.9" fill="#1c1917" />
          <path d="M24 28l-1.5 2h3Z" fill="#fda4af" />
          <path d="M24 30v2M24 32q-2 1.6-4 0M24 32q2 1.6 4 0M10 26h6M10 30l6-1M38 26h-6M38 30l-6-1" stroke="#fef3c7" strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  coruja: {
    label: 'Coruja',
    render: (p) =>
      frame(p, '#1e3a5f', (
        <>
          <path d="M13 14l4 4M35 14l-4 4" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="27" r="13" fill="#a16207" />
          <circle cx="19" cy="24" r="5.5" fill="#fef3c7" />
          <circle cx="29" cy="24" r="5.5" fill="#fef3c7" />
          <circle cx="19" cy="24" r="2.2" fill="#1c1917" />
          <circle cx="29" cy="24" r="2.2" fill="#1c1917" />
          <path d="M24 27l-2.5 3.5h5Z" fill="#f59e0b" />
          <path d="M17 34q7 4 14 0" stroke="#78350f" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  ninja: {
    label: 'Ninja',
    render: (p) =>
      frame(p, '#334155', (
        <>
          <circle cx="24" cy="26" r="12" fill="#0f172a" />
          <rect x="13" y="21" width="22" height="8" rx="4" fill="#fcd9b8" />
          <circle cx="20" cy="25" r="1.6" fill="#0f172a" />
          <circle cx="28" cy="25" r="1.6" fill="#0f172a" />
          <path d="M35 20l7-4-3 7Z" fill="#dc2626" />
          <path d="M36 22q4 1 5 4" stroke="#dc2626" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  pirata: {
    label: 'Pirata',
    render: (p) =>
      frame(p, '#0e7490', (
        <>
          <circle cx="24" cy="27" r="11" fill="#fcd9b8" />
          <path d="M11 22 C13 10 35 10 37 22 l-2 2 c-6 -4 -20 -4 -22 0 Z" fill="#1e293b" />
          <path d="M11 22 q13 -5 26 0" stroke="#f8fafc" strokeWidth="1.6" fill="none" />
          <circle cx="16" cy="14.5" r="1.6" fill="#f8fafc" />
          <path d="M25 24 h7 l-1 4 h-5 Z" fill="#1e293b" />
          <path d="M18 20 L34 24" stroke="#1e293b" strokeWidth="1.6" />
          <circle cx="20" cy="26" r="1.5" fill="#1e293b" />
          <path d="M20 32q3 2.4 7 0.6" stroke="#b45309" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <circle cx="13" cy="30" r="1.8" fill="#fde047" />
        </>
      )),
  },
  fada: {
    label: 'Fada',
    render: (p) =>
      frame(p, '#86efac', (
        <>
          <ellipse cx="13" cy="22" rx="6" ry="9" fill="#f0fdfa" opacity="0.9" transform="rotate(-18 13 22)" />
          <ellipse cx="35" cy="22" rx="6" ry="9" fill="#f0fdfa" opacity="0.9" transform="rotate(18 35 22)" />
          <circle cx="24" cy="25" r="9" fill="#fcd9b8" />
          <path d="M15 24c0-7 4-11 9-11s9 4 9 11c-2.5-3.5-4-5-6-5-1.5 1.6-4.5 1.6-6 0-2 0-3.5 1.5-6 5Z" fill="#fb7185" />
          <path d="M24 8 l1.2 2.6 2.8 0.4 -2 2 0.4 2.8 -2.4 -1.4 -2.4 1.4 0.4 -2.8 -2 -2 2.8 -0.4 Z" fill="#fde047" />
          <circle cx="21" cy="24" r="1.4" fill="#1e293b" />
          <circle cx="27" cy="24" r="1.4" fill="#1e293b" />
          <path d="M21.5 28.5q2.5 2 5 0" stroke="#b45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M14 36c4 3 16 3 20 0v3c-4 3-16 3-20 0Z" fill="#4ade80" />
        </>
      )),
  },
  vampiro: {
    label: 'Vampirinho',
    render: (p) =>
      frame(p, '#3b0764', (
        <>
          <path d="M8 34 Q16 24 24 30 Q32 24 40 34 L34 30 L30 36 L24 32 L18 36 L14 30 Z" fill="#1e1b4b" />
          <circle cx="24" cy="22" r="10" fill="#f1f5f9" />
          <path d="M14 20 C15 10 33 10 34 20 L29 16 L24 19 L19 16 Z" fill="#0f172a" />
          <circle cx="20.5" cy="21" r="1.5" fill="#dc2626" />
          <circle cx="27.5" cy="21" r="1.5" fill="#dc2626" />
          <path d="M20.5 26 q3.5 2.4 7 0" stroke="#7f1d1d" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M21.4 26.6 l0.8 2.4 1 -2.2 Z M25.8 26.8 l0.8 2.2 1 -2.4 Z" fill="#f8fafc" />
        </>
      )),
  },
  panda: {
    label: 'Panda',
    render: (p) =>
      frame(p, '#84cc16', (
        <>
          <circle cx="14" cy="13" r="4.5" fill="#1c1917" />
          <circle cx="34" cy="13" r="4.5" fill="#1c1917" />
          <circle cx="24" cy="26" r="13" fill="#f8fafc" />
          <ellipse cx="19" cy="23" rx="3.4" ry="4" fill="#1c1917" transform="rotate(-14 19 23)" />
          <ellipse cx="29" cy="23" rx="3.4" ry="4" fill="#1c1917" transform="rotate(14 29 23)" />
          <circle cx="19.5" cy="23" r="1.3" fill="#f8fafc" />
          <circle cx="28.5" cy="23" r="1.3" fill="#f8fafc" />
          <circle cx="19.8" cy="23.2" r="0.65" fill="#1c1917" />
          <circle cx="28.2" cy="23.2" r="0.65" fill="#1c1917" />
          <ellipse cx="24" cy="29.5" rx="2" ry="1.4" fill="#1c1917" />
          <path d="M24 31v1.6M24 32.6q-2 1.6-3.6 0M24 32.6q2 1.6 3.6 0" stroke="#1c1917" strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  sereia: {
    label: 'Sereia',
    render: (p) =>
      frame(p, '#0ea5e9', (
        <>
          <path d="M20 38 q4 4 8 0 q-1 -4 -4 -6 q-3 2 -4 6 Z" fill="#14b8a6" />
          <path d="M16 42 q4 -3 8 -1 q4 -2 8 1 q-4 3 -8 1 q-4 2 -8 -1 Z" fill="#0d9488" />
          <circle cx="24" cy="22" r="9" fill="#fcd9b8" />
          <path d="M15 22 c-1 -8 4 -12 9 -12 s10 4 9 12 c-1.5 -3 -2.5 -5 -5 -5.5 c-1.5 1.6 -6.5 1.6 -8 0 c-2.5 0.5 -3.5 2.5 -5 5.5 Z" fill="#dc2626" />
          <path d="M13 22 q2 6 4 8 q-3 -1 -5 -4 Z M35 22 q-2 6 -4 8 q3 -1 5 -4 Z" fill="#dc2626" />
          <path d="M24 5 l0.9 2 2.1 0.3 -1.5 1.5 0.3 2.1 -1.8 -1 -1.8 1 0.3 -2.1 -1.5 -1.5 2.1 -0.3 Z" fill="#fde047" />
          <circle cx="21" cy="21" r="1.4" fill="#1e293b" />
          <circle cx="27" cy="21" r="1.4" fill="#1e293b" />
          <path d="M21.5 25.5q2.5 2 5 0" stroke="#b45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )),
  },
};

export const AVATAR_SLUGS = Object.keys(AVATARS);

/** Avatar embutido por slug; devolve null se o slug não existir. */
export function BuiltinAvatar({ slug, ...props }: { slug: string | null | undefined } & P) {
  if (!slug || !AVATARS[slug]) return null;
  return AVATARS[slug].render(props);
}
