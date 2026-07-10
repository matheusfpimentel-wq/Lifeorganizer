/**
 * Payload Pix "copia e cola" (BR Code estático) — núcleo puro.
 *
 * Conforme o Manual de Padrões para Iniciação do Pix (BR Code / EMV-MPM):
 * - Campos TLV: ID (2 dígitos) + tamanho (2 dígitos) + valor.
 * - GUI do arranjo Pix: "br.gov.bcb.pix" no campo 26-00.
 * - CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF) sobre todo o payload
 *   incluindo o prefixo "6304" do próprio campo de CRC.
 */
import { centsToDecimalString } from './money';

export const PIX_GUI = 'br.gov.bcb.pix';

/** CRC16-CCITT-FALSE: poly 0x1021, init 0xFFFF, sem reflexão, sem xorout. */
export function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Monta um campo TLV EMV: ID + tamanho (2 dígitos) + valor. */
export function emvField(id: string, value: string): string {
  if (!/^\d{2}$/.test(id)) throw new Error(`ID EMV inválido: ${id}`);
  if (value.length === 0 || value.length > 99) {
    throw new Error(`Valor EMV do campo ${id} com tamanho inválido: ${value.length}`);
  }
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

/** Remove acentos e caracteres fora do conjunto aceito pelo BR Code. */
export function sanitizeEmvText(input: string, maxLength: number): string {
  const stripped = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-@]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, maxLength);
}

export interface PixPayloadOptions {
  /** Chave Pix do recebedor (e-mail, CPF/CNPJ, telefone +55... ou EVP). */
  pixKey: string;
  /** Nome do recebedor (até 25 caracteres após sanitização). */
  merchantName: string;
  /** Cidade do recebedor (até 15 caracteres após sanitização). */
  merchantCity: string;
  /** Valor em centavos; omitir/0 gera BR Code sem valor definido. */
  amountCents?: number;
  /** Identificador da transação (até 25 chars); "***" para estático sem txid. */
  txid?: string;
}

/** Gera o payload completo do Pix copia e cola (BR Code estático). */
export function buildPixPayload(options: PixPayloadOptions): string {
  const { pixKey, amountCents, txid = '***' } = options;
  if (!pixKey || pixKey.length > 77) throw new Error('Chave Pix inválida');
  if (!/^[A-Za-z0-9*.\-_]{1,25}$/.test(txid)) throw new Error(`txid inválido: ${txid}`);

  const merchantName = sanitizeEmvText(options.merchantName, 25);
  const merchantCity = sanitizeEmvText(options.merchantCity, 15).toUpperCase();
  if (!merchantName) throw new Error('Nome do recebedor obrigatório');
  if (!merchantCity) throw new Error('Cidade do recebedor obrigatória');

  const merchantAccountInfo = emvField('00', PIX_GUI) + emvField('01', pixKey);

  let payload =
    emvField('00', '01') + // Payload Format Indicator
    emvField('26', merchantAccountInfo) + // Merchant Account Information (Pix)
    emvField('52', '0000') + // Merchant Category Code (não informado)
    emvField('53', '986'); // Moeda: BRL (ISO 4217)

  if (amountCents !== undefined && amountCents > 0) {
    payload += emvField('54', centsToDecimalString(amountCents));
  }

  payload +=
    emvField('58', 'BR') +
    emvField('59', merchantName) +
    emvField('60', merchantCity) +
    emvField('62', emvField('05', txid)) +
    '6304'; // prefixo do CRC entra no cálculo

  return payload + crc16ccitt(payload);
}

/** Valida o CRC de um payload BR Code (útil em testes e importação). */
export function isValidPixPayload(payload: string): boolean {
  if (payload.length < 8) return false;
  const body = payload.slice(0, -4);
  if (!body.endsWith('6304')) return false;
  return crc16ccitt(body) === payload.slice(-4).toUpperCase();
}
