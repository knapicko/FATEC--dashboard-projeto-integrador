// Edge Function: admin-contas
// Gerencia quem pode acessar o painel administrativo do ConsertaJá.
//
// Ações (POST JSON { action, ... }):
//   list                                -> lista as contas do Supabase Auth com a flag is_admin
//   create     { email, password }      -> cria a conta no Auth (se ainda não existir) e a adiciona em public.admin_users
//   set_admin  { user_id, admin: bool } -> adiciona/remove a conta de public.admin_users
//
// Só administradores já cadastrados em public.admin_users podem chamar esta função.
// Ela usa a chave service_role, injetada automaticamente pelo Supabase — nunca a coloque no front-end.
//
// Publicar:  npx supabase functions deploy admin-contas --project-ref <PROJECT_REF>
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PER_PAGE = 1000;
const MAX_PAGES = 50;

async function listAllUsers(admin: SupabaseClient): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw new Error(`Erro ao listar contas: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < PER_PAGE) break;
  }
  return users;
}

async function findUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const users = await listAllUsers(admin);
  return users.find((user) => (user.email ?? '').toLowerCase() === email) ?? null;
}

async function adminIds(admin: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await admin.from('admin_users').select('user_id');
  if (error) throw new Error(`Erro ao ler admin_users: ${error.message}`);
  return new Set((data ?? []).map((row: { user_id: string }) => row.user_id));
}

async function addAdmin(admin: SupabaseClient, userId: string, email: string | undefined) {
  const { data: existing, error: readError } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (readError) throw new Error(`Erro ao ler admin_users: ${readError.message}`);
  if (existing) return false;

  // Tenta gravar também o e-mail; se a tabela não tiver essa coluna, grava só o user_id.
  let { error } = await admin.from('admin_users').insert({ user_id: userId, email: email ?? null });
  if (error && (error.code === '42703' || error.code === 'PGRST204' || /column/i.test(error.message))) {
    ({ error } = await admin.from('admin_users').insert({ user_id: userId }));
  }
  if (error) throw new Error(`Erro ao adicionar administrador: ${error.message}`);
  return true;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Configuração interna ausente: SUPABASE_SERVICE_ROLE_KEY.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Quem está chamando?
  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return json({ error: 'Não autenticado.' }, 401);

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const caller = authData?.user;
  if (authError || !caller) return json({ error: 'Sessão inválida. Entre novamente no painel.' }, 401);

  try {
    // 2. Só administradores podem gerenciar administradores.
    const admins = await adminIds(admin);
    if (!admins.has(caller.id)) {
      return json({ error: 'Esta conta não está autorizada a gerenciar administradores.' }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Corpo da requisição inválido.' }, 400);
    }
    const action = String(body.action ?? '');

    // ---------- LISTAR ----------
    if (action === 'list') {
      const users = await listAllUsers(admin);

      // Nome do perfil no app (tabela usuarios.auth_id), quando existir.
      const names = new Map<string, string>();
      const ids = users.map((user) => user.id);
      for (let index = 0; index < ids.length; index += 200) {
        const { data } = await admin
          .from('usuarios')
          .select('auth_id, nome')
          .in('auth_id', ids.slice(index, index + 200));
        for (const row of (data ?? []) as { auth_id: string; nome: string | null }[]) {
          if (row.nome) names.set(row.auth_id, row.nome);
        }
      }

      const accounts = users
        .map((user) => ({
          id: user.id,
          email: user.email ?? user.phone ?? '(sem e-mail)',
          nome: names.get(user.id) ?? (user.user_metadata?.nome as string | undefined) ?? null,
          is_admin: admins.has(user.id),
          created_at: user.created_at ?? null,
          last_sign_in_at: user.last_sign_in_at ?? null,
          confirmed: Boolean(user.email_confirmed_at ?? user.confirmed_at),
        }))
        .sort((a, b) => Number(b.is_admin) - Number(a.is_admin) || a.email.localeCompare(b.email));

      return json({ me: caller.id, accounts });
    }

    // ---------- CRIAR ----------
    if (action === 'create') {
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      if (!EMAIL_RE.test(email)) return json({ error: 'Informe um e-mail válido.' }, 400);

      const existing = await findUserByEmail(admin, email);
      if (existing) {
        const added = await addAdmin(admin, existing.id, existing.email);
        return json({ created: false, already_admin: !added, user_id: existing.id });
      }

      if (password.length < 8) return json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, 400);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { criado_pelo_painel: true },
      });
      if (createError || !created.user) {
        return json({ error: `Não foi possível criar a conta: ${createError?.message ?? 'erro desconhecido'}` }, 400);
      }

      try {
        await addAdmin(admin, created.user.id, email);
      } catch (error) {
        // Não deixa uma conta "solta" no Auth se não conseguiu torná-la admin.
        await admin.auth.admin.deleteUser(created.user.id);
        throw error;
      }
      return json({ created: true, already_admin: false, user_id: created.user.id });
    }

    // ---------- LIGAR / DESLIGAR ADMIN ----------
    if (action === 'set_admin') {
      const userId = String(body.user_id ?? '');
      const makeAdmin = body.admin === true;
      if (!userId) return json({ error: 'Conta não informada.' }, 400);

      if (makeAdmin) {
        const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
        if (targetError || !target.user) return json({ error: 'Conta não encontrada no Supabase Auth.' }, 400);
        await addAdmin(admin, userId, target.user.email);
        return json({ ok: true });
      }

      if (userId === caller.id) return json({ error: 'Você não pode remover o seu próprio acesso.' }, 400);
      if (admins.has(userId) && admins.size <= 1) {
        return json({ error: 'O painel precisa ter pelo menos um administrador.' }, 400);
      }
      const { error } = await admin.from('admin_users').delete().eq('user_id', userId);
      if (error) throw new Error(`Erro ao remover administrador: ${error.message}`);
      return json({ ok: true });
    }

    return json({ error: `Ação desconhecida: ${action || '(vazia)'}` }, 400);
  } catch (error) {
    console.error('admin-contas:', error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
