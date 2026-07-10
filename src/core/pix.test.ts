import { describe, expect, it } from 'vitest';
import {
  buildPixPayload,
  crc16ccitt,
  emvField,
  isValidPixPayload,
  sanitizeEmvText,
} from './pix';

describe('crc16ccitt', () => {
  it('vetor conhecido "123456789" -> 29B1 (CRC-16/CCITT-FALSE)', () => {
    expect(crc16ccitt('123456789')).toBe('29B1');
  });

  it('exemplo canônico do manual BR Code do Banco Central -> 1D3D', () => {
    const body =
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000' +
      '5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
    expect(crc16ccitt(body)).toBe('1D3D');
  });
});

describe('emvField', () => {
  it('monta ID + tamanho + valor', () => {
    expect(emvField('00', '01')).toBe('000201');
    expect(emvField('58', 'BR')).toBe('5802BR');
  });

  it('rejeita valor vazio ou acima de 99 chars', () => {
    expect(() => emvField('00', '')).toThrow();
    expect(() => emvField('00', 'x'.repeat(100))).toThrow();
  });
});

describe('sanitizeEmvText', () => {
  it('remove acentos e trunca', () => {
    expect(sanitizeEmvText('João da Silva Çedilha', 25)).toBe('Joao da Silva Cedilha');
    expect(sanitizeEmvText('São Paulo', 15)).toBe('Sao Paulo');
    expect(sanitizeEmvText('Nome Muito Comprido Demais Para Caber', 25)).toHaveLength(25);
  });
});

describe('buildPixPayload', () => {
  it('reproduz byte a byte o exemplo do manual do BCB (sem valor)', () => {
    const payload = buildPixPayload({
      pixKey: '123e4567-e12b-12d1-a456-426655440000',
      merchantName: 'Fulano de Tal',
      merchantCity: 'BRASILIA',
    });
    expect(payload).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000' +
        '5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    );
  });

  it('inclui o campo 54 com o valor em reais quando amountCents > 0', () => {
    const payload = buildPixPayload({
      pixKey: 'fulano@exemplo.com',
      merchantName: 'Fulano',
      merchantCity: 'SAO PAULO',
      amountCents: 12345,
    });
    expect(payload).toContain('5406123.45');
    expect(isValidPixPayload(payload)).toBe(true);
  });

  it('valor inteiro em reais formata com 2 casas', () => {
    const payload = buildPixPayload({
      pixKey: 'fulano@exemplo.com',
      merchantName: 'Fulano',
      merchantCity: 'SAO PAULO',
      amountCents: 10_000,
    });
    expect(payload).toContain('5406100.00');
  });

  it('CRC final sempre válido (propriedade)', () => {
    const cases = [
      { pixKey: '+5511999998888', merchantName: 'Ana Souza', merchantCity: 'Rio de Janeiro' },
      { pixKey: '12345678909', merchantName: 'José Ávila', merchantCity: 'Belém', amountCents: 1 },
      {
        pixKey: 'a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4',
        merchantName: 'República Xyz',
        merchantCity: 'Curitiba',
        amountCents: 999_99,
      },
    ];
    for (const options of cases) {
      expect(isValidPixPayload(buildPixPayload(options))).toBe(true);
    }
  });

  it('sanitiza nome e cidade com acento', () => {
    const payload = buildPixPayload({
      pixKey: 'x@y.com',
      merchantName: 'João',
      merchantCity: 'São Paulo',
    });
    expect(payload).toContain('5904Joao');
    expect(payload).toContain('6009SAO PAULO');
  });

  it('rejeita entradas inválidas', () => {
    expect(() =>
      buildPixPayload({ pixKey: '', merchantName: 'A', merchantCity: 'B' }),
    ).toThrow();
    expect(() =>
      buildPixPayload({ pixKey: 'x@y.com', merchantName: 'çç', merchantCity: 'B' }),
    ).not.toThrow();
    expect(() =>
      buildPixPayload({ pixKey: 'x@y.com', merchantName: 'A', merchantCity: 'B', txid: 'in válido' }),
    ).toThrow(/txid/);
  });

  it('isValidPixPayload detecta corrupção', () => {
    const payload = buildPixPayload({
      pixKey: 'x@y.com',
      merchantName: 'Fulano',
      merchantCity: 'RECIFE',
      amountCents: 5000,
    });
    expect(isValidPixPayload(payload)).toBe(true);
    expect(isValidPixPayload(payload.slice(0, -1) + '0')).toBe(false);
  });
});
