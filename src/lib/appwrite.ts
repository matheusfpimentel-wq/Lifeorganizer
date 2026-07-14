/**
 * Cliente Appwrite (web SDK) e constantes de tabelas.
 * A API key NUNCA aparece aqui — apenas endpoint/projectId públicos.
 */
import { Account, Client, Functions, Storage, TablesDB, Teams } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;

export const isAppwriteConfigured = Boolean(endpoint && projectId);

export const client = new Client();
if (isAppwriteConfigured) {
  client.setEndpoint(endpoint!).setProject(projectId!);
}

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const teams = new Teams(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const DB_ID = (import.meta.env.VITE_APPWRITE_DATABASE_ID as string | undefined) ?? 'morada';

export const TABLES = {
  households: 'households',
  profiles: 'profiles',
  pushSubscriptions: 'pushSubscriptions',
  icalTokens: 'icalTokens',
  routineBlocks: 'routineBlocks',
  events: 'events',
  exercises: 'exercises',
  workoutPlans: 'workoutPlans',
  workoutPlanDays: 'workoutPlanDays',
  workoutPlanExercises: 'workoutPlanExercises',
  workoutSessions: 'workoutSessions',
  workoutSessionSets: 'workoutSessionSets',
  shoppingLists: 'shoppingLists',
  shoppingItems: 'shoppingItems',
  staples: 'staples',
  expenses: 'expenses',
  settlements: 'settlements',
  fundContributions: 'fundContributions',
  gameScores: 'gameScores',
  tasks: 'tasks',
  taskOccurrences: 'taskOccurrences',
} as const;

export type TableId = (typeof TABLES)[keyof typeof TABLES];

export const BUCKETS = {
  avatars: 'avatars',
  receipts: 'receipts',
} as const;

/** Canal realtime de uma tabela (linhas). O filtro por lar vem das permissões. */
export function tableChannel(tableId: TableId): string {
  return `databases.${DB_ID}.tables.${tableId}.rows`;
}

/**
 * URL absoluta do app respeitando o base path (ex.: /Lifeorganizer/ no GitHub
 * Pages). Usado em links de convite e magic link — sem o base o link cai fora
 * do app. `import.meta.env.BASE_URL` já termina com '/'.
 */
export function appUrl(path = ''): string {
  const base = import.meta.env.BASE_URL; // '/' ou '/Lifeorganizer/'
  return `${window.location.origin}${base}${path.replace(/^\//, '')}`;
}
