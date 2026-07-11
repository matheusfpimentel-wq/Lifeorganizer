import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { Icon } from '@/components/icons';

const TRIGGER_PX = 72;
const MAX_PX = 110;

/**
 * Linha "deslize para concluir": arrastar para a direita revela um fundo
 * verde com check; soltar além do limiar dispara a ação. Só reage a gesto
 * horizontal (rolagem vertical passa direto) e só em toque — no desktop os
 * botões continuam sendo o caminho.
 */
export default function SwipeRow({
  onSwipe,
  label,
  children,
}: {
  onSwipe: () => void;
  label: string;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const horizontal = useRef(false);
  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(false);

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    horizontal.current = false;
    setAnimating(false);
  }

  function onTouchMove(e: TouchEvent) {
    if (!start.current) return;
    const t = e.touches[0];
    const deltaX = t.clientX - start.current.x;
    const deltaY = t.clientY - start.current.y;
    if (!horizontal.current) {
      if (Math.abs(deltaX) < 12) return; // ainda ambíguo
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        start.current = null; // gesto vertical: deixa a rolagem agir
        return;
      }
      horizontal.current = true;
    }
    setDx(Math.max(0, Math.min(MAX_PX, deltaX)));
  }

  function onTouchEnd() {
    const fired = dx >= TRIGGER_PX;
    setAnimating(true);
    setDx(0);
    start.current = null;
    horizontal.current = false;
    if (fired) onSwipe();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl" aria-label={label}>
      <div
        aria-hidden
        className="absolute inset-0 flex items-center rounded-2xl bg-emerald-500 pl-4 text-white"
        style={{ opacity: dx > 0 ? Math.min(1, dx / TRIGGER_PX) : 0 }}
      >
        <Icon.Check className="h-6 w-6" />
      </div>
      <div
        style={{ transform: `translateX(${dx}px)`, transition: animating ? 'transform 160ms ease-out' : 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
