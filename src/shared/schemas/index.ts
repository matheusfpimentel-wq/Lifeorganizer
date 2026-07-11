/**
 * Schemas Zod compartilhados entre frontend e functions.
 * Valores de enum são slugs ASCII; labels pt-BR ficam na UI (ADR-008).
 * Moeda em centavos (int); datas ISO/UTC; horários locais "HH:mm".
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitivos
// ---------------------------------------------------------------------------
export const idSchema = z.string().min(1).max(36);
export const centsSchema = z.number().int().min(0);
export const positiveCentsSchema = z.number().int().positive();
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (HH:mm)');
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (#rrggbb)');
export const weekdaySchema = z.number().int().min(0).max(6); // 0=domingo ... 6=sábado

// ---------------------------------------------------------------------------
// Household / perfil
// ---------------------------------------------------------------------------
export const householdSettingsSchema = z.object({
  weekStart: z.enum(['monday', 'sunday']).default('sunday'),
  currency: z.literal('BRL').default('BRL'),
});
export type HouseholdSettings = z.infer<typeof householdSettingsSchema>;

export const householdSchema = z.object({
  teamId: idSchema,
  name: z.string().min(1).max(128),
  settings: householdSettingsSchema,
});

export const notificationPrefsSchema = z.object({
  dailySummaryTime: localTimeSchema.nullable().default(null), // ex.: "07:30" (BRT)
  taskReminders: z.boolean().default(true),
  eventReminders: z.boolean().default(true),
});
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

export const profileSchema = z.object({
  userId: idSchema,
  displayName: z.string().min(1).max(64),
  avatarFileId: idSchema.nullish(),
  color: hexColorSchema,
  pixKey: z.string().max(77).nullish(),
  notificationPrefs: notificationPrefsSchema.nullish(),
});
export type Profile = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Rotina semanal
// ---------------------------------------------------------------------------
export const routineCategorySchema = z.enum([
  'trabalho', 'estudo', 'treino', 'casa', 'lazer', 'sono', 'outro',
]);

export const routineBlockSchema = z
  .object({
    householdId: idSchema,
    memberId: idSchema.nullish(), // null = lar inteiro
    title: z.string().min(1).max(128),
    category: routineCategorySchema,
    weekdays: z.array(weekdaySchema).min(1),
    startTime: localTimeSchema,
    endTime: localTimeSchema,
    color: hexColorSchema.nullish(),
    notes: z.string().max(500).nullish(),
    active: z.boolean().default(true),
  })
  .refine((b) => b.startTime < b.endTime, {
    message: 'Horário de início deve ser antes do fim',
    path: ['endTime'],
  });

// ---------------------------------------------------------------------------
// Calendário
// ---------------------------------------------------------------------------
export const eventSchema = z
  .object({
    householdId: idSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(2000).nullish(),
    location: z.string().max(200).nullish(),
    startAt: isoDateTimeSchema,
    endAt: isoDateTimeSchema,
    allDay: z.boolean().default(false),
    memberIds: z.array(idSchema).default([]), // vazio = lar inteiro
    rrule: z.string().max(500).nullish(),
    exdates: z.array(isoDateTimeSchema).default([]),
    reminderMinutes: z.array(z.number().int().min(0).max(7 * 24 * 60)).default([]),
    createdBy: idSchema,
  })
  .refine((e) => new Date(e.startAt) <= new Date(e.endAt), {
    message: 'Início deve ser antes do fim',
    path: ['endAt'],
  });

// ---------------------------------------------------------------------------
// Academia
// ---------------------------------------------------------------------------
export const muscleGroupSchema = z.enum([
  'peito', 'costas', 'ombros', 'biceps', 'triceps', 'pernas', 'gluteos', 'core', 'cardio', 'outro',
]);
export const equipmentSchema = z.enum([
  'barra', 'halter', 'maquina', 'polia', 'pesoCorporal', 'kettlebell', 'elastico', 'outro',
]);

export const exerciseSchema = z.object({
  householdId: idSchema.nullish(), // null = seed global
  name: z.string().min(1).max(128),
  muscleGroup: muscleGroupSchema,
  equipment: equipmentSchema,
  instructions: z.string().max(2000).nullish(),
  videoUrl: z.string().url().max(500).nullish(),
});

export const workoutPlanSchema = z.object({
  householdId: idSchema,
  memberId: idSchema,
  name: z.string().min(1).max(128),
  goal: z.string().max(200).nullish(),
  active: z.boolean().default(true),
});

export const workoutSessionSetSchema = z.object({
  householdId: idSchema,
  sessionId: idSchema,
  exerciseId: idSchema,
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0),
  loadKg: z.number().min(0),
  rpe: z.number().min(0).max(10).nullish(),
});

// ---------------------------------------------------------------------------
// Lista de compras
// ---------------------------------------------------------------------------
export const shoppingCategorySchema = z.enum([
  'hortifruti', 'acougue', 'limpeza', 'higiene', 'mercearia', 'bebidas', 'outro',
]);

export const shoppingListSchema = z.object({
  householdId: idSchema,
  name: z.string().min(1).max(128),
  status: z.enum(['active', 'archived']).default('active'),
  isDefault: z.boolean().default(false),
  totalCents: centsSchema.nullish(),
});

export const shoppingItemSchema = z.object({
  householdId: idSchema,
  listId: idSchema,
  name: z.string().min(1).max(128),
  qty: z.number().positive().default(1),
  unit: z.string().max(20).nullish(),
  category: shoppingCategorySchema.default('outro'),
  note: z.string().max(200).nullish(),
  addedBy: idSchema,
  checked: z.boolean().default(false),
  checkedBy: idSchema.nullish(),
  checkedAt: isoDateTimeSchema.nullish(),
  priceCents: centsSchema.nullish(),
});

export const stapleSchema = z.object({
  householdId: idSchema,
  name: z.string().min(1).max(128),
  defaultQty: z.number().positive().default(1),
  unit: z.string().max(20).nullish(),
  category: shoppingCategorySchema.default('outro'),
});

// ---------------------------------------------------------------------------
// Divisão de contas
// ---------------------------------------------------------------------------
export const expenseCategorySchema = z.enum([
  'moradia', 'mercado', 'contasFixas', 'transporte', 'lazer', 'saude', 'pets', 'outro',
]);
export const splitTypeSchema = z.enum(['equal', 'percent', 'shares', 'exact']);

export const splitEntrySchema = z.object({
  memberId: idSchema,
  amountCents: centsSchema,
});
export type SplitEntry = z.infer<typeof splitEntrySchema>;

export const expenseSchema = z
  .object({
    householdId: idSchema,
    description: z.string().min(1).max(200),
    amountCents: positiveCentsSchema,
    category: expenseCategorySchema,
    paidBy: idSchema,
    date: isoDateTimeSchema,
    splitType: splitTypeSchema,
    splits: z.array(splitEntrySchema).min(1),
    status: z.enum(['confirmed', 'pending']).default('confirmed'),
    rrule: z.string().max(500).nullish(),
    recurrenceKey: z.string().max(100).nullish(),
    receiptFileId: idSchema.nullish(),
    createdBy: idSchema,
  })
  .refine(
    (e) => e.splits.reduce((acc, s) => acc + s.amountCents, 0) === e.amountCents,
    { message: 'A soma dos rateios deve ser igual ao total', path: ['splits'] },
  );

export const settlementSchema = z.object({
  householdId: idSchema,
  fromMember: idSchema,
  toMember: idSchema,
  amountCents: positiveCentsSchema,
  method: z.enum(['pix', 'dinheiro', 'outro']),
  settledAt: isoDateTimeSchema,
  note: z.string().max(200).nullish(),
});

// ---------------------------------------------------------------------------
// Tarefas
// ---------------------------------------------------------------------------
export const taskCategorySchema = z.enum([
  'limpeza', 'cozinha', 'roupas', 'pets', 'manutencao', 'admin', 'outro',
]);
export const taskPrioritySchema = z.enum(['baixa', 'media', 'alta']);
export const assignmentModeSchema = z.enum(['fixed', 'rotation', 'volunteer']);

export const checklistItemSchema = z.object({
  label: z.string().min(1).max(200),
  done: z.boolean().default(false),
});

export const taskSchema = z
  .object({
    householdId: idSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(2000).nullish(),
    type: z.enum(['routine', 'specific']),
    category: taskCategorySchema,
    rrule: z.string().max(500).nullish(),
    dueDate: isoDateTimeSchema.nullish(),
    assignmentMode: assignmentModeSchema,
    assignedMemberId: idSchema.nullish(),
    rotationMemberIds: z.array(idSchema).default([]),
    rotationIndex: z.number().int().min(0).default(0),
    priority: taskPrioritySchema.default('media'),
    checklist: z.array(checklistItemSchema).default([]),
    points: z.number().int().min(1).max(100).default(1),
    active: z.boolean().default(true),
  })
  .refine((t) => t.type !== 'routine' || !!t.rrule, {
    message: 'Tarefa rotineira exige recorrência',
    path: ['rrule'],
  })
  .refine((t) => t.type !== 'specific' || !!t.dueDate, {
    message: 'Tarefa específica exige data',
    path: ['dueDate'],
  })
  .refine((t) => t.assignmentMode !== 'fixed' || !!t.assignedMemberId, {
    message: 'Modo fixo exige responsável',
    path: ['assignedMemberId'],
  })
  .refine((t) => t.assignmentMode !== 'rotation' || t.rotationMemberIds.length > 0, {
    message: 'Revezamento exige lista de membros',
    path: ['rotationMemberIds'],
  });

export const taskOccurrenceSchema = z.object({
  householdId: idSchema,
  taskId: idSchema,
  dueAt: isoDateTimeSchema,
  assignedMemberId: idSchema.nullish(),
  status: z.enum(['pending', 'done', 'skipped']).default('pending'),
  completedBy: idSchema.nullish(),
  completedAt: isoDateTimeSchema.nullish(),
});

// ---------------------------------------------------------------------------
// Push
// ---------------------------------------------------------------------------
export const pushSubscriptionSchema = z.object({
  userId: idSchema,
  endpoint: z.string().url().max(1024),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  lastSeenAt: isoDateTimeSchema.nullish(),
});
