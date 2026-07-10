/** Moeda sempre em centavos (integer). Formatação pt-BR/BRL. */

export function formatCentsBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/** "1.234,56" | "1234.56" | "1234,56" -> 123456. Lança em entrada inválida. */
export function parseBRLToCents(input: string): number {
  const trimmed = input.trim().replace(/^R\$\s*/i, '');
  if (!trimmed) throw new Error('Valor vazio');
  let normalized = trimmed;
  if (trimmed.includes(',')) {
    // formato pt-BR: pontos são milhares, vírgula é decimal
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Valor inválido: ${input}`);
  return Math.round(value * 100);
}

/** Centavos -> "1234.56" (formato do campo 54 do BR Code Pix). */
export function centsToDecimalString(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error(`Centavos inválidos: ${cents}`);
  return (cents / 100).toFixed(2);
}
