/**
 * Keepalive do Appwrite via LOGIN de desenvolvedor.
 *
 * O plano Free só considera "atividade de desenvolvimento" uma sessão de conta
 * (o que acontece ao abrir o cloud.appwrite.io e logar) — tráfego com API key
 * (CRUD ou até deploy) é ignorado. Este script replica o login: cria uma sessão
 * de e-mail/senha, faz uma chamada autenticada de conta e encerra a sessão.
 *
 * Roda no GitHub Actions a cada ~5 dias. As credenciais vivem SÓ como secrets de
 * CI (APPWRITE_EMAIL / APPWRITE_PASSWORD) — nunca no bundle. Não usa API key.
 * Requer que a conta NÃO tenha 2FA (login programático quebra com MFA).
 */
import { Client, Account } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const email = process.env.APPWRITE_EMAIL;
const password = process.env.APPWRITE_PASSWORD;

if (!endpoint || !projectId || !email || !password) {
  console.error('[keepalive-login] faltam APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_EMAIL e/ou APPWRITE_PASSWORD.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId); // sem API key — login de conta
const account = new Account(client);

try {
  const session = await account.createEmailPasswordSession({ email, password });
  client.setSession(session.secret);
  const me = await account.get();
  console.log(`[keepalive-login] login OK como ${me.email} @ ${new Date().toISOString()}`);
  // higiene: encerra a sessão recém-criada pra não acumular
  try {
    await account.deleteSession({ sessionId: 'current' });
    console.log('[keepalive-login] sessão encerrada.');
  } catch (e) {
    console.log('[keepalive-login] aviso: não encerrou a sessão:', e?.message ?? e);
  }
  console.log('[keepalive-login] atividade de desenvolvedor registrada no Appwrite.');
} catch (err) {
  console.error('[keepalive-login] falhou:', err?.message ?? err);
  process.exit(1);
}
