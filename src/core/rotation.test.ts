import { describe, expect, it } from 'vitest';
import {
  nextAssignee,
  occurrenceKey,
  planOccurrences,
  type TaskForMaterialization,
} from './rotation';

const active = (...ids: string[]) => new Set(ids);

describe('nextAssignee', () => {
  it('avança circularmente pelo índice', () => {
    const members = ['a', 'b', 'c'];
    const all = active('a', 'b', 'c');
    expect(nextAssignee(members, 0, all)).toEqual({ memberId: 'a', nextIndex: 1 });
    expect(nextAssignee(members, 1, all)).toEqual({ memberId: 'b', nextIndex: 2 });
    expect(nextAssignee(members, 2, all)).toEqual({ memberId: 'c', nextIndex: 3 });
    // índice é normalizado para a posição encontrada + 1
    expect(nextAssignee(members, 3, all)).toEqual({ memberId: 'a', nextIndex: 1 });
  });

  it('pula membros inativos', () => {
    const members = ['a', 'b', 'c'];
    expect(nextAssignee(members, 1, active('a', 'c'))).toEqual({
      memberId: 'c',
      nextIndex: 3,
    });
  });

  it('sem ativos: retorna null e não avança o índice', () => {
    expect(nextAssignee(['a', 'b'], 5, active())).toEqual({ memberId: null, nextIndex: 5 });
  });

  it('lista vazia: null', () => {
    expect(nextAssignee([], 0, active('a'))).toEqual({ memberId: null, nextIndex: 0 });
  });
});

describe('planOccurrences', () => {
  const baseTask: TaskForMaterialization = {
    taskId: 't1',
    assignmentMode: 'rotation',
    rotationMemberIds: ['a', 'b'],
    rotationIndex: 0,
  };
  const dates = [
    new Date('2026-07-10T10:00:00Z'),
    new Date('2026-07-11T10:00:00Z'),
    new Date('2026-07-12T10:00:00Z'),
  ];

  it('revezamento alterna e devolve o índice atualizado', () => {
    const { occurrences, nextRotationIndex } = planOccurrences(
      baseTask,
      dates,
      new Set(),
      active('a', 'b'),
    );
    expect(occurrences.map((o) => o.assignedMemberId)).toEqual(['a', 'b', 'a']);
    expect(nextRotationIndex).toBe(1); // posição de 'a' (0) + 1, normalizado

  });

  it('é idempotente: chaves existentes não geram duplicata nem avançam o índice', () => {
    const first = planOccurrences(baseTask, dates, new Set(), active('a', 'b'));
    const existing = new Set(first.occurrences.map((o) => occurrenceKey('t1', o.dueAt)));
    const second = planOccurrences(
      { ...baseTask, rotationIndex: first.nextRotationIndex },
      dates,
      existing,
      active('a', 'b'),
    );
    expect(second.occurrences).toEqual([]);
    expect(second.nextRotationIndex).toBe(first.nextRotationIndex);
  });

  it('materialização parcial: só gera as datas novas, continuando o revezamento', () => {
    const first = planOccurrences(baseTask, dates.slice(0, 2), new Set(), active('a', 'b'));
    const existing = new Set(first.occurrences.map((o) => occurrenceKey('t1', o.dueAt)));
    const second = planOccurrences(
      { ...baseTask, rotationIndex: first.nextRotationIndex },
      dates,
      existing,
      active('a', 'b'),
    );
    expect(second.occurrences).toHaveLength(1);
    expect(second.occurrences[0].assignedMemberId).toBe('a'); // a,b já saíram -> a de novo
  });

  it('modo fixed usa sempre o mesmo responsável', () => {
    const { occurrences, nextRotationIndex } = planOccurrences(
      { ...baseTask, assignmentMode: 'fixed', assignedMemberId: 'z' },
      dates,
      new Set(),
      active('a', 'b'),
    );
    expect(occurrences.every((o) => o.assignedMemberId === 'z')).toBe(true);
    expect(nextRotationIndex).toBe(0);
  });

  it('modo volunteer gera ocorrências sem dono', () => {
    const { occurrences } = planOccurrences(
      { ...baseTask, assignmentMode: 'volunteer' },
      dates,
      new Set(),
      active('a', 'b'),
    );
    expect(occurrences.every((o) => o.assignedMemberId === null)).toBe(true);
  });

  it('membro inativo é pulado no revezamento', () => {
    const { occurrences } = planOccurrences(
      { ...baseTask, rotationMemberIds: ['a', 'b', 'c'] },
      dates,
      new Set(),
      active('a', 'c'),
    );
    expect(occurrences.map((o) => o.assignedMemberId)).toEqual(['a', 'c', 'a']);
  });
});
