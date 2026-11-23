-- =====================================================================
-- ConsertaJá · Dashboard administrativo
-- Gestão de ofícios/funções + suporte à tela "Administradores"
--
-- Como usar: Supabase > SQL Editor > cole este arquivo inteiro > Run.
-- O script é idempotente (pode ser executado mais de uma vez) e não
-- apaga dados nem desativa o RLS de nenhuma tabela.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) is_dashboard_admin(): criada apenas se ainda não existir
--    (o admin_access.sql original já cria esta função).
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.is_dashboard_admin()') is null then
    execute $fn$
      create function public.is_dashboard_admin()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as 'select exists (select 1 from public.admin_users where user_id = auth.uid())'
    $fn$;
    grant execute on function public.is_dashboard_admin() to authenticated;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) admin_users: colunas opcionais usadas pela tela de administradores
--    (a Edge Function admin-contas também funciona sem elas).
-- ---------------------------------------------------------------------
alter table public.admin_users add column if not exists email text;
alter table public.admin_users add column if not exists created_at timestamptz not null default now();

-- Preenche o e-mail dos administradores que já existiam.
update public.admin_users a
set email = u.email
from auth.users u
where u.id = a.user_id and a.email is null;

-- ---------------------------------------------------------------------
-- 3) Exclusão segura de funções e ofícios (usada pelo dashboard).
--    Rodam com privilégio do dono, mas só para administradores do painel.
--    Se o item estiver em uso (FK), o erro 23503 é devolvido ao painel,
--    que mostra quais vínculos impedem a exclusão.
-- ---------------------------------------------------------------------
create or replace function public.admin_delete_funcao(p_id_funcao bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_dashboard_admin() then
    raise exception 'Acesso negado: somente administradores do painel.' using errcode = '42501';
  end if;

  delete from public.funcoes where id_funcao = p_id_funcao;
  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'Função % não encontrada (talvez já tenha sido excluída).', p_id_funcao using errcode = 'P0002';
  end if;
  return v_count;
end;
$$;

create or replace function public.admin_delete_oficio(p_id_oficio bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funcoes integer;
  v_oficio integer;
begin
  if not public.is_dashboard_admin() then
    raise exception 'Acesso negado: somente administradores do painel.' using errcode = '42501';
  end if;

  -- Funções do ofício saem junto; se alguma estiver em uso, a transação inteira é desfeita.
  delete from public.funcoes where fk_oficio = p_id_oficio;
  get diagnostics v_funcoes = row_count;

  delete from public.oficios where id_oficio = p_id_oficio;
  get diagnostics v_oficio = row_count;

  if v_oficio = 0 then
    raise exception 'Ofício % não encontrado (talvez já tenha sido excluído).', p_id_oficio using errcode = 'P0002';
  end if;
  return v_funcoes;
end;
$$;

revoke all on function public.admin_delete_funcao(bigint) from public, anon;
revoke all on function public.admin_delete_oficio(bigint) from public, anon;
grant execute on function public.admin_delete_funcao(bigint) to authenticated;
grant execute on function public.admin_delete_oficio(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- 4) Políticas RLS para criar/editar/excluir ofícios e funções pelo painel.
--    Sem uma política de DELETE/UPDATE, o Supabase não retorna erro:
--    simplesmente não altera nenhuma linha (era o que acontecia antes).
--    As permissões só são concedidas em tabelas que estão com RLS ativo.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['oficios', 'funcoes'] loop
    if exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relrowsecurity
    ) then
      execute format('drop policy if exists %I on public.%I', 'dashboard_admin_insert_' || t, t);
      execute format('drop policy if exists %I on public.%I', 'dashboard_admin_update_' || t, t);
      execute format('drop policy if exists %I on public.%I', 'dashboard_admin_delete_' || t, t);

      execute format('create policy %I on public.%I for insert to authenticated with check (public.is_dashboard_admin())',
                     'dashboard_admin_insert_' || t, t);
      execute format('create policy %I on public.%I for update to authenticated using (public.is_dashboard_admin()) with check (public.is_dashboard_admin())',
                     'dashboard_admin_update_' || t, t);
      execute format('create policy %I on public.%I for delete to authenticated using (public.is_dashboard_admin())',
                     'dashboard_admin_delete_' || t, t);

      execute format('grant insert, update, delete on public.%I to authenticated', t);
    end if;
  end loop;
end $$;

-- Sequências das tabelas (necessário para INSERT com id automático).
do $$
declare
  s text;
begin
  for s in
    select pg_get_serial_sequence('public.' || tbl, col)
    from (values ('oficios', 'id_oficio'), ('funcoes', 'id_funcao')) v(tbl, col)
  loop
    if s is not null then
      execute format('grant usage, select on sequence %s to authenticated', s);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5) Exclusão em cascata de solicitações, serviços e postagens.
--    Percorre as chaves estrangeiras (pg_constraint) e apaga primeiro os
--    registros que dependem dos itens escolhidos (pagamentos_stripe,
--    pagamentos_solicitacao, anexos, deslocamentos, curtidas...).
--    Com p_executar = false só conta o que seria apagado (prévia exibida
--    no painel antes de confirmar). Vínculos ON DELETE SET NULL são
--    mantidos pelo próprio Postgres (o registro fica sem o vínculo).
-- ---------------------------------------------------------------------
create or replace function public._admin_cascata(
  p_tabela regclass,
  p_coluna text,
  p_valores text[],
  p_executar boolean,
  p_nivel integer,
  p_relatorio jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  fk record;
  v_filhos text[];
  v_qtd bigint;
  v_nome text := p_tabela::text;
begin
  if p_valores is null or cardinality(p_valores) = 0 then
    return p_relatorio;
  end if;
  if p_nivel > 12 then
    raise exception 'Dependências encadeadas demais a partir de %.', v_nome;
  end if;

  for fk in
    select c.conrelid::regclass as filho, a.attname::text as col_filho, pa.attname::text as col_pai
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_attribute pa on pa.attrelid = c.confrelid and pa.attnum = c.confkey[1]
    where c.contype = 'f'
      and c.confrelid = p_tabela
      and cardinality(c.conkey) = 1
      and c.confdeltype in ('a', 'r', 'c')   -- no action, restrict, cascade
  loop
    execute format('select array_agg(distinct %I::text) from %s where %I::text = any($1)', fk.col_pai, p_tabela, p_coluna)
      into v_filhos using p_valores;
    p_relatorio := public._admin_cascata(fk.filho, fk.col_filho, v_filhos, p_executar, p_nivel + 1, p_relatorio);
  end loop;

  if p_executar then
    execute format('delete from %s where %I::text = any($1)', p_tabela, p_coluna) using p_valores;
    get diagnostics v_qtd = row_count;
  else
    execute format('select count(*) from %s where %I::text = any($1)', p_tabela, p_coluna) into v_qtd using p_valores;
  end if;

  if v_qtd > 0 then
    p_relatorio := jsonb_set(p_relatorio, array[v_nome], to_jsonb(coalesce((p_relatorio ->> v_nome)::bigint, 0) + v_qtd));
  end if;
  return p_relatorio;
end;
$$;

create or replace function public.admin_exclusao_cascata(p_tabela text, p_ids bigint[], p_executar boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pk text;
begin
  if not public.is_dashboard_admin() then
    raise exception 'Acesso negado: somente administradores do painel.' using errcode = '42501';
  end if;

  v_pk := case p_tabela
    when 'solicitacoes' then 'id_solicitacao'
    when 'servicos_profissional' then 'id_servico_prof'
    when 'postagens' then 'id_postagem'
  end;
  if v_pk is null then
    raise exception 'Exclusão em cascata não permitida para a tabela %.', p_tabela using errcode = '42501';
  end if;
  if p_ids is null or cardinality(p_ids) = 0 then
    return '{}'::jsonb;
  end if;

  return public._admin_cascata(('public.' || quote_ident(p_tabela))::regclass, v_pk, p_ids::text[], p_executar, 0, '{}'::jsonb);
end;
$$;

revoke all on function public._admin_cascata(regclass, text, text[], boolean, integer, jsonb) from public, anon, authenticated;
revoke all on function public.admin_exclusao_cascata(text, bigint[], boolean) from public, anon;
grant execute on function public.admin_exclusao_cascata(text, bigint[], boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 6) (Opcional) Tornar uma conta existente administradora pelo SQL.
--    Normalmente isso é feito na tela "Administradores" do painel.
-- ---------------------------------------------------------------------
-- insert into public.admin_users (user_id, email)
-- select id, email from auth.users where email = 'seu@email.com'
-- on conflict do nothing;
