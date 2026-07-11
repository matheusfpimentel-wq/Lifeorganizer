/**
 * Calendário em America/Sao_Paulo (UTC−3 fixo). Trabalha com "wall dates":
 * Dates cujos campos UTC representam a hora local de SP.
 */
export const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

export const toWall = (utc: Date): Date => new Date(utc.getTime() - SP_OFFSET_MS);
export const fromWall = (wall: Date): Date => new Date(wall.getTime() + SP_OFFSET_MS);

/** Chave 'YYYY-MM-DD' do dia LOCAL de SP para um instante UTC. */
export function spDateKey(utc: Date): string {
  return toWall(utc).toISOString().slice(0, 10);
}

/** Dia da semana local (0=domingo … 6=sábado). */
export function spWeekday(utc: Date): number {
  return toWall(utc).getUTCDay();
}

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MonthCell {
  key: string; // YYYY-MM-DD (dia local)
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  startUtc: Date; // início do dia em UTC
}

/**
 * Matriz de 42 células (6 semanas) do mês local, começando em `weekStart`.
 * `monthOffset` 0 = mês atual, -1 = anterior, +1 = próximo.
 */
export function monthMatrix(
  now: Date,
  monthOffset: number,
  weekStart: 0 | 1,
): { cells: MonthCell[]; startUtc: Date; endUtc: Date; label: string; year: number; month: number } {
  const wallNow = toWall(now);
  const year = wallNow.getUTCFullYear();
  const month = wallNow.getUTCMonth() + monthOffset;
  const firstWall = new Date(Date.UTC(year, month, 1));
  const firstWeekday = firstWall.getUTCDay();
  const lead = (firstWeekday - weekStart + 7) % 7;
  const gridStartWall = new Date(firstWall.getTime() - lead * DAY_MS);
  const todayKey = spDateKey(now);
  const thisMonth = firstWall.getUTCMonth();

  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const cellWall = new Date(gridStartWall.getTime() + i * DAY_MS);
    cells.push({
      key: cellWall.toISOString().slice(0, 10),
      dayOfMonth: cellWall.getUTCDate(),
      inMonth: cellWall.getUTCMonth() === thisMonth,
      isToday: cellWall.toISOString().slice(0, 10) === todayKey,
      startUtc: fromWall(cellWall),
    });
  }

  const label = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    month: 'long',
    year: 'numeric',
  }).format(fromWall(firstWall));

  return {
    cells,
    startUtc: cells[0].startUtc,
    endUtc: new Date(cells[41].startUtc.getTime() + DAY_MS - 1),
    label,
    year: firstWall.getUTCFullYear(),
    month: thisMonth,
  };
}

/** 7 dias locais da semana que contém `now` (+weekOffset semanas). */
export function weekDays(
  now: Date,
  weekOffset: number,
  weekStart: 0 | 1,
): { days: { key: string; startUtc: Date; weekday: number }[]; startUtc: Date; endUtc: Date } {
  const wallNow = toWall(now);
  const todayMidnightWall = new Date(
    Date.UTC(wallNow.getUTCFullYear(), wallNow.getUTCMonth(), wallNow.getUTCDate()),
  );
  const back = (todayMidnightWall.getUTCDay() - weekStart + 7) % 7;
  const startWall = new Date(todayMidnightWall.getTime() - back * DAY_MS + weekOffset * 7 * DAY_MS);
  const days = Array.from({ length: 7 }, (_, i) => {
    const w = new Date(startWall.getTime() + i * DAY_MS);
    return { key: w.toISOString().slice(0, 10), startUtc: fromWall(w), weekday: w.getUTCDay() };
  });
  return {
    days,
    startUtc: days[0].startUtc,
    endUtc: new Date(days[6].startUtc.getTime() + DAY_MS - 1),
  };
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
