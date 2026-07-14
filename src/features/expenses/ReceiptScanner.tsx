/**
 * Leitor de NFC-e: escaneia o QR do cupom fiscal (ou recebe o link colado),
 * busca os itens via function `api` (/nfce) e deixa marcar, item a item, o
 * que é de cada um ou do casal — virando UMA despesa com divisão exata.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { ExecutionMethod } from 'appwrite';
import { functions } from '@/lib/appwrite';
import { formatCentsBRL } from '@/lib/format';
import { Icon } from '@/components/icons';
import { useCreateExpense } from './hooks';

interface Member {
  id: string;
  name: string;
  color?: string | null;
}

interface NfceItem {
  name: string;
  qty: number;
  totalCents: number;
}

interface NfceData {
  store: string | null;
  totalCents: number | null;
  items: NfceItem[];
}

/** 'all' = do casal (divide igual); senão, id do membro dono do item. */
type Owner = 'all' | string;

async function fetchNfce(url: string): Promise<NfceData> {
  const exec = await functions.createExecution({
    functionId: 'api',
    body: JSON.stringify({ url }),
    async: false,
    xpath: '/nfce',
    method: ExecutionMethod.POST,
  });
  const parsed = exec.responseBody ? JSON.parse(exec.responseBody) : {};
  if (!parsed.ok) throw new Error(parsed.error ?? 'Não consegui ler a nota.');
  return parsed as NfceData;
}

/** Divide os itens entre os membros: item de um vai inteiro pra ele; item do
 * casal é rachado igualmente (sobras de centavo vão pros primeiros). */
function computeItemSplits(
  items: NfceItem[],
  owners: Owner[],
  memberIds: string[],
): { memberId: string; amountCents: number }[] {
  const totals = new Map<string, number>(memberIds.map((id) => [id, 0]));
  items.forEach((item, i) => {
    const owner = owners[i] ?? 'all';
    if (owner !== 'all' && totals.has(owner)) {
      totals.set(owner, totals.get(owner)! + item.totalCents);
      return;
    }
    const base = Math.floor(item.totalCents / memberIds.length);
    let remainder = item.totalCents - base * memberIds.length;
    for (const id of memberIds) {
      totals.set(id, totals.get(id)! + base + (remainder > 0 ? 1 : 0));
      if (remainder > 0) remainder--;
    }
  });
  return memberIds.map((id) => ({ memberId: id, amountCents: totals.get(id)! }));
}

export default function ReceiptScanner({
  householdId,
  currentUserId,
  members,
  onClose,
}: {
  householdId: string | null;
  currentUserId: string;
  members: Member[];
  onClose: () => void;
}) {
  const createExpense = useCreateExpense(householdId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NfceData | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [paidBy, setPaidBy] = useState(currentUserId);

  const memberIds = useMemo(() => members.map((m) => m.id), [members]);

  async function loadUrl(url: string) {
    stopCamera();
    setLoading(true);
    setError(null);
    try {
      const parsed = await fetchNfce(url);
      setData(parsed);
      setOwners(parsed.items.map(() => 'all'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function stopCamera() {
    setScanning(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
    } catch {
      setCameraError('Sem acesso à câmera. Cole o link do QR abaixo (a câmera nativa do iPhone lê o QR e deixa copiar).');
    }
  }

  // loop de leitura do QR enquanto a câmera está aberta
  useEffect(() => {
    if (!scanning || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    void video.play();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
        if (code?.data && /^https?:\/\//i.test(code.data.trim())) {
          void loadUrl(code.data.trim());
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  useEffect(() => () => stopCamera(), []);

  const itemsTotal = (data?.items ?? []).reduce((acc, i) => acc + i.totalCents, 0);
  const splits = data ? computeItemSplits(data.items, owners, memberIds) : [];

  function cycleOwner(index: number) {
    setOwners((prev) => {
      const next = [...prev];
      const order: Owner[] = ['all', ...memberIds];
      const cur = order.indexOf(next[index] ?? 'all');
      next[index] = order[(cur + 1) % order.length];
      return next;
    });
  }

  function ownerLabel(owner: Owner): string {
    if (owner === 'all') return 'Casal';
    return members.find((m) => m.id === owner)?.name.split(' ')[0] ?? 'Membro';
  }

  function submit() {
    if (!data) return;
    createExpense.mutate(
      {
        description: `Mercado — ${data.store ?? 'nota fiscal'}`.slice(0, 200),
        amountCents: itemsTotal,
        category: 'mercado',
        paidBy,
        date: new Date().toISOString(),
        splitSpec: { type: 'exact', parts: splits.filter((s) => s.amountCents > 0) },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Nota fiscal pelo QR</h2>
        <button className="text-slate-400 hover:text-red-600" aria-label="Fechar leitor" onClick={() => { stopCamera(); onClose(); }}>
          <Icon.X className="h-5 w-5" />
        </button>
      </div>

      {!data && (
        <>
          <p className="text-sm text-slate-500">
            Aponte para o QR do cupom fiscal (NFC-e). Os itens da nota chegam prontos e você marca o
            que é de cada um.
          </p>
          {scanning ? (
            <div className="relative overflow-hidden rounded-2xl">
              <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80" />
              <button className="btn-secondary absolute bottom-2 left-1/2 !min-h-[36px] -translate-x-1/2 !bg-white/90 !px-3 text-sm" onClick={stopCamera}>
                Parar câmera
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={startCamera} disabled={loading}>
              Abrir câmera e escanear
            </button>
          )}
          {cameraError && <p className="text-sm text-amber-600">{cameraError}</p>}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="ou cole o link do QR aqui"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
            />
            <button
              className="btn-secondary"
              disabled={!manualUrl.trim() || loading}
              onClick={() => void loadUrl(manualUrl.trim())}
            >
              Ler
            </button>
          </div>
          {loading && <p className="text-sm text-slate-500">Buscando a nota na SEFAZ…</p>}
        </>
      )}

      {data && (
        <>
          <p className="text-sm text-slate-500">
            {data.store ?? 'Nota'} · {data.items.length} itens ·{' '}
            <strong>{formatCentsBRL(itemsTotal)}</strong>. Toque na etiqueta para alternar de quem é
            cada item.
          </p>
          <ul className="flex flex-col gap-2">
            {data.items.map((item, i) => {
              const owner = owners[i] ?? 'all';
              return (
                <li key={i} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name.toLowerCase()}</p>
                    <p className="text-xs text-slate-500">
                      {item.qty !== 1 ? `${item.qty}× · ` : ''}{formatCentsBRL(item.totalCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-transform active:scale-90 ${
                      owner === 'all'
                        ? 'bg-brand-600 text-white'
                        : 'text-white'
                    }`}
                    style={owner !== 'all' ? { backgroundColor: members.find((m) => m.id === owner)?.color ?? '#64748b' } : undefined}
                    aria-label={`Item ${item.name}: de ${ownerLabel(owner)} — toque para alternar`}
                    onClick={() => cycleOwner(i)}
                  >
                    {ownerLabel(owner)}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-2xl bg-slate-50 p-2 text-sm dark:bg-slate-800">
            {splits.map((s) => (
              <div key={s.memberId} className="flex justify-between">
                <span>{members.find((m) => m.id === s.memberId)?.name.split(' ')[0] ?? 'Membro'}</span>
                <span>{formatCentsBRL(s.amountCents)}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="nfcePaidBy">Quem pagou</label>
            <select id="nfcePaidBy" className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {createExpense.isError && (
            <p className="text-sm text-red-600">{(createExpense.error as Error).message}</p>
          )}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={submit} disabled={createExpense.isPending || itemsTotal <= 0}>
              Lançar {formatCentsBRL(itemsTotal)}
            </button>
            <button className="btn-secondary" onClick={() => { setData(null); setError(null); }}>
              Reler
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
