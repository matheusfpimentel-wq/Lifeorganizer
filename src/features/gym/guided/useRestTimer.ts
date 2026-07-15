/**
 * Cronômetro de descanso do Treino: contagem regressiva, ±15s, pular, e ao
 * zerar dispara som (WebAudio, sem asset) + vibração, respeitando as
 * preferências. Mantém a tela acesa (Screen Wake Lock) enquanto ativo.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTrainingStore } from '@/stores/training';

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.52);
    osc.onended = () => void ctx.close();
  } catch {
    /* áudio indisponível — segue sem som */
  }
}

type WakeLockSentinelLike = { release: () => Promise<void> } | null;

export function useRestTimer() {
  const settings = useTrainingStore((s) => s.settings);
  const [remaining, setRemaining] = useState<number | null>(null); // segundos; null = parado
  const endRef = useRef(0);
  const wakeRef = useRef<WakeLockSentinelLike>(null);
  const doneFiredRef = useRef(false);

  const releaseWake = useCallback(() => {
    void wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
  }, []);

  const requestWake = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wl = (navigator as any).wakeLock;
      if (wl?.request) wakeRef.current = await wl.request('screen');
    } catch {
      /* wake lock indisponível */
    }
  }, []);

  const stop = useCallback(() => {
    setRemaining(null);
    releaseWake();
  }, [releaseWake]);

  const start = useCallback(
    (seconds: number) => {
      doneFiredRef.current = false;
      endRef.current = Date.now() + seconds * 1000;
      setRemaining(seconds);
      void requestWake();
    },
    [requestWake],
  );

  const add = useCallback((delta: number) => {
    if (remaining === null) return;
    endRef.current += delta * 1000;
    setRemaining(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)));
  }, [remaining]);

  // tick
  useEffect(() => {
    if (remaining === null) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !doneFiredRef.current) {
        doneFiredRef.current = true;
        if (settings.sound) beep();
        if (settings.vibration && navigator.vibrate) navigator.vibrate([120, 60, 120]);
        window.setTimeout(() => stop(), 400);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [remaining, settings.sound, settings.vibration, stop]);

  useEffect(() => () => releaseWake(), [releaseWake]);

  return { remaining, start, stop, add, active: remaining !== null };
}
