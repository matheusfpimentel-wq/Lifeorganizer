import { useEffect, useRef, useState } from 'react';

/** Timer de descanso regressivo. Toca um bipe leve ao terminar (se permitido). */
export default function RestTimer({ seconds, onDismiss }: { seconds: number; onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const startedRef = useRef(Date.now());

  useEffect(() => {
    startedRef.current = Date.now();
    setRemaining(seconds);
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedRef.current) / 1000);
      setRemaining(Math.max(0, seconds - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [seconds]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const done = remaining === 0;

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
        done ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100'
      }`}
    >
      <span>{done ? 'Descanso concluído — próxima série!' : `Descanso: ${mm}:${ss}`}</span>
      <button className="font-medium underline" onClick={onDismiss}>
        {done ? 'Ok' : 'Pular'}
      </button>
    </div>
  );
}
