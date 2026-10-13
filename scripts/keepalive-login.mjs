/**
 * Keepalive do Appwrite via LOGIN de desenvolvedor no Console.
 *
 * O plano Free só considera "atividade de desenvolvimento" uma sessão no Console
 * (o que acontece ao abrir o cloud.appwrite.io e logar). Tráfego com API key
 * (CRUD ou deploy) é ignorado. Este script replica abrir o Console:
 *   1. cria sessão de e-mail/senha no projeto especial `console`
 *      (a conta de desenvolvedor vive lá, NÃO no projeto do app);
 *   2. lê a conta e abre o projeto do app (GET /projects/{id}), como o Console faz;
 *   3. encerra a sessão.
 *
 * Usa fetch puro (sem SDK): sem API key o Appwrite não devolve session.secret,
 * então a sessão é carregada pelo cookie `a_session_console`.
 *
 * Roda no GitHub Actions a cada ~5 dias. Credenciais só como secrets de CI
 * (APPWRITE_EMAIL / APPWRITE_PASSWORD). Requer conta SEM 2FA.
 */

const consoleEndpoint = (process.env.APPWRITE_CONSOLE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const email = process.env.APPWRITE_EMAIL;
const password = process.env.APPWRITE_PASSWORD;

if (!projectId || !email || !password) {
  console.error('[keepalive-login] faltam APPWRITE_PROJECT_ID, APPWRITE_EMAIL e/ou APPWRITE_PASSWORD.');
  process.exit(1);
}

const baseHeaders = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': 'console',
  'X-Appwrite-Response-Format': '1.6.0',
};

async function call(method, path, { body, cookie } = {}) {
  const res = await fetch(`${consoleEndpoint}${path}`, {
    method,
    headers: { ...baseHeaders, ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${data?.message ?? text}`);
    err.type = data?.type;
    throw err;
  }
  return { res, data };
}

try {
  const { res } = await call('POST', '/account/sessions/email', { body: { email, password } });

  const cookie = (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .filter((c) => c.startsWith('a_session_console'))
    .join('; ');
  if (!cookie) throw new Error('login aceito, mas o cookie de sessão não veio na resposta.');

  const { data: me } = await call('GET', '/account', { cookie });
  console.log(`[keepalive-login] login OK no Console como ${me.email} @ ${new Date().toISOString()}`);

  try {
    const { data: project } = await call('GET', `/projects/${projectId}`, { cookie });
    console.log(`[keepalive-login] projeto aberto: ${project.name ?? projectId}`);
  } catch (e) {
    console.log('[keepalive-login] aviso: não abriu o projeto:', e?.message ?? e);
  }

  try {
    await call('DELETE', '/account/sessions/current', { cookie });
    console.log('[keepalive-login] sessão encerrada.');
  } catch (e) {
    console.log('[keepalive-login] aviso: não encerrou a sessão:', e?.message ?? e);
  }

  console.log('[keepalive-login] atividade de desenvolvedor registrada no Appwrite.');
} catch (err) {
  console.error('[keepalive-login] falhou:', err?.message ?? err);
  if (err?.type === 'user_more_factors_required') {
    console.error('[keepalive-login] a conta tem 2FA ativo; login programático não funciona com MFA.');
  }
  process.exit(1);
}
