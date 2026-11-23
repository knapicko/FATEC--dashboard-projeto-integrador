// Edge Function: admin-consultas
// Mostra no painel as consultas SQL salvas no SQL Editor do Supabase (snippets)
// e permite executá-las. Usa a Management API do Supabase.
//
// Ações (POST JSON { action, ... }):
//   list                -> lista as consultas salvas do projeto (sem o SQL)
//   get   { id }        -> devolve uma consulta com o SQL
//   run   { query }     -> executa o SQL no banco do projeto e devolve as linhas
//
// Só administradores cadastrados em public.admin_users podem chamar esta função.
//
// Configuração (uma vez):
//   1. Gere um token pessoal em https://supabase.com/dashboard/account/tokens
//   2. npx supabase secrets set CONSULTAS_ACCESS_TOKEN=sbp_... --project-ref <PROJECT_REF>
//      (o nome não pode começar com SUPABASE_, prefixo reservado pelo Supabase)
//   3. npx supabase functions deploy admin-consultas --project-ref <PROJECT_REF>
// As consultas listadas são as que o dono do token enxerga no SQL Editor.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const API = 'https://api.supabase.com/v1';
const MAX_PAGES = 20;

class SetupError extends Error {}

async function management(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    if (response.status === 401) throw new SetupError('O token CONSULTAS_ACCESS_TOKEN é inválido ou expirou. Gere outro e atualize o segredo.');
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String((payload as { message: unknown }).message)
      : typeof payload === 'string' && payload ? payload : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? '').trim();
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuração interna ausente: SUPABASE_SERVICE_ROLE_KEY.' }, 500);
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const authorization = request.headers.get('Authorization') ?? '';
  const jwt = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!jwt) return json({ error: 'Não autenticado.' }, 401);
  const { data: authData, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !authData?.user) return json({ error: 'Sessão inválida. Entre novamente no painel.' }, 401);

  const { data: adminRow, error: adminError } = await admin
    .from('admin_users').select('user_id').eq('user_id', authData.user.id).maybeSingle();
  if (adminError) return json({ error: `Erro ao ler admin_users: ${adminError.message}` }, 500);
  if (!adminRow) return json({ error: 'Esta conta não está autorizada a usar as consultas.' }, 403);

  const token = (Deno.env.get('CONSULTAS_ACCESS_TOKEN') ?? '').trim();
  if (!token) return json({ setup_required: true, error: 'Falta configurar o segredo CONSULTAS_ACCESS_TOKEN.' });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corpo da requisição inválido.' }, 400);
  }
  const action = String(body.action ?? '');

  try {
    if (action === 'list') {
      const snippets: unknown[] = [];
      let cursor = '';
      for (let page = 0; page < MAX_PAGES; page++) {
        const params = new URLSearchParams({ project_ref: projectRef, limit: '100' });
        if (cursor) params.set('cursor', cursor);
        const result = await management(`/snippets?${params}`, token) as { data?: unknown[]; cursor?: string };
        snippets.push(...(result?.data ?? []));
        if (!result?.cursor || !result.data?.length || result.cursor === cursor) break;
        cursor = result.cursor;
      }
      return json({ snippets });
    }

    if (action === 'get') {
      const id = String(body.id ?? '');
      if (!id) return json({ error: 'Consulta não informada.' }, 400);
      const snippet = await management(`/snippets/${encodeURIComponent(id)}`, token);
      return json({ snippet });
    }

    if (action === 'run') {
      const query = String(body.query ?? '').trim();
      if (!query) return json({ error: 'A consulta está vazia.' }, 400);
      const started = Date.now();
      const result = await management(`/projects/${projectRef}/database/query`, token, {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      console.log(`admin-consultas: ${authData.user.email ?? authData.user.id} executou ${query.length} caracteres`);
      return json({ rows: Array.isArray(result) ? result : [], raw: Array.isArray(result) ? null : result, ms: Date.now() - started });
    }

    return json({ error: `Ação desconhecida: ${action || '(vazia)'}` }, 400);
  } catch (error) {
    if (error instanceof SetupError) return json({ setup_required: true, error: error.message });
    console.error('admin-consultas:', error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
