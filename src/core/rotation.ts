/**
 * Revezamento de tarefas e materialização de ocorrências — núcleo puro.
 *
 * Regra: assigned = rotationMemberIds[rotationIndex % len]; membros inativos
 * são pulados; o índice avança após cada ocorrência gerada.
 * Materialização idempotente: chave lógica taskId+dueAt — ocorrências já
 * existentes nunca são recriadas.
 */

export interface RotationResult {
  memberId: string | null;
  nextIndex: number;
}

/**
 * Próximo responsável do revezamento, pulando membros inativos.
 * Retorna memberId null se ninguém estiver ativo (ocorrência fica sem dono).
 */
export function nextAssignee(
  rotationMemberIds: string[],
  rotationIndex: number,
  activeMemberIds: ReadonlySet<string>,
): RotationResult {
  const len = rotationMemberIds.length;
  if (len === 0) return { memberId: null, nextIndex: rotationIndex };

  for (let step = 0; step < len; step++) {
    const idx = (rotationIndex + step) % len;
    const candidate = rotationMemberIds[idx];
    if (activeMemberIds.has(candidate)) {
      return { memberId: candidate, nextIndex: idx + 1 };
    }
  }
  return { memberId: null, nextIndex: rotationIndex };
}

export type AssignmentMode = 'fixed' | 'rotation' | 'volunteer';

export interface TaskForMaterialization {
  taskId: string;
  assignmentMode: AssignmentMode;
  assignedMemberId?: string | null;
  rotationMemberIds: string[];
  rotationIndex: number;
}

export interface PlannedOccurrence {
  taskId: string;
  dueAt: Date;
  assignedMemberId: string | null;
}

export interface MaterializationResult {
  occurrences: PlannedOccurrence[];
  /** Novo rotationIndex a persistir na tarefa (inalterado se nada foi gerado). */
  nextRotationIndex: number;
}

/** Chave lógica de idempotência de uma ocorrência. */
export function occurrenceKey(taskId: string, dueAt: Date): string {
  return `${taskId}|${dueAt.toISOString()}`;
}

/**
 * Planeja ocorrências para as datas dadas, pulando as já existentes.
 * Puro: quem chama busca as existentes e persiste o resultado.
 */
export function planOccurrences(
  task: TaskForMaterialization,
  dueDates: Date[],
  existingKeys: ReadonlySet<string>,
  activeMemberIds: ReadonlySet<string>,
): MaterializationResult {
  const occurrences: PlannedOccurrence[] = [];
  let rotationIndex = task.rotationIndex;

  const sorted = [...dueDates].sort((a, b) => a.getTime() - b.getTime());
  for (const dueAt of sorted) {
    if (existingKeys.has(occurrenceKey(task.taskId, dueAt))) continue;

    let assignedMemberId: string | null = null;
    if (task.assignmentMode === 'fixed') {
      assignedMemberId = task.assignedMemberId ?? null;
    } else if (task.assignmentMode === 'rotation') {
      const result = nextAssignee(task.rotationMemberIds, rotationIndex, activeMemberIds);
      assignedMemberId = result.memberId;
      rotationIndex = result.nextIndex;
    }
    // volunteer: sem dono — qualquer membro pode "pegar"

    occurrences.push({ taskId: task.taskId, dueAt, assignedMemberId });
  }

  return { occurrences, nextRotationIndex: rotationIndex };
}
