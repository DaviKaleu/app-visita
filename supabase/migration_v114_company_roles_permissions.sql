-- Top Planejados V114 - Empresa, cargos múltiplos e permissões reais
-- Rode após a V111. Não apaga dados. Migra do modelo "created_by" para empresa + membros + cargos.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Top Planejados',
  owner_id uuid references auth.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table if not exists public.company_member_roles (
  company_member_id uuid not null references public.company_members(id) on delete cascade,
  role text not null check (role in ('owner','manager','seller','finance','stock','installer')),
  created_at timestamptz not null default now(),
  primary key(company_member_id, role)
);

alter table public.user_company_settings add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.clients add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.projects add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.services add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.transactions add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.inventory_items add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.payroll_employees add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.payroll_records add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.suppliers add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.plan_requests add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.render_usage add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.security_logs add column if not exists company_id uuid references public.companies(id) on delete set null;

-- Cria uma empresa padrão a partir do primeiro admin ativo, preservando o banco atual.
with first_admin as (
  select p.id, coalesce(nullif(ucs.company_name,''),'Top Planejados') as company_name
  from public.profiles p
  left join public.user_company_settings ucs on ucs.user_id = p.id
  where p.active = true and p.role = 'admin'
  order by p.created_at asc
  limit 1
)
insert into public.companies (name, owner_id)
select company_name, id from first_admin
where not exists (select 1 from public.companies)
on conflict do nothing;

-- Vincula perfis existentes à primeira empresa. Admin vira dono; usuários comuns viram vendedores por padrão.
with default_company as (
  select id from public.companies order by created_at asc limit 1
), inserted_members as (
  insert into public.company_members (company_id, user_id, active)
  select dc.id, p.id, p.active
  from public.profiles p
  cross join default_company dc
  where not exists (
    select 1 from public.company_members cm where cm.company_id = dc.id and cm.user_id = p.id
  )
  returning id, user_id
)
insert into public.company_member_roles (company_member_id, role)
select im.id, case when p.role = 'admin' then 'owner' else 'seller' end
from inserted_members im
join public.profiles p on p.id = im.user_id
on conflict do nothing;

-- Garante cargo de owner para admins já vinculados.
insert into public.company_member_roles (company_member_id, role)
select cm.id, 'owner'
from public.company_members cm
join public.profiles p on p.id = cm.user_id
where p.role = 'admin' and p.active = true
on conflict do nothing;

-- Backfill de company_id nos dados existentes.
update public.user_company_settings t set company_id = cm.company_id from public.company_members cm where t.user_id = cm.user_id and t.company_id is null;
update public.clients t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.projects t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.services t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.transactions t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.inventory_items t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.payroll_employees t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.payroll_records t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.suppliers t set company_id = cm.company_id from public.company_members cm where t.created_by = cm.user_id and t.company_id is null;
update public.plan_requests t set company_id = cm.company_id from public.company_members cm where t.user_id = cm.user_id and t.company_id is null;
update public.render_usage t set company_id = cm.company_id from public.company_members cm where t.user_id = cm.user_id and t.company_id is null;
update public.security_logs t set company_id = cm.company_id from public.company_members cm where t.actor_id = cm.user_id and t.company_id is null;

-- Mantém uma configuração oficial por empresa: a linha do dono. Linhas antigas de funcionários continuam existindo, mas deixam de ser a configuração compartilhada.
insert into public.user_company_settings (user_id, company_id, company_name)
select c.owner_id, c.id, c.name
from public.companies c
where c.owner_id is not null
on conflict (user_id) do update set company_id = excluded.company_id, company_name = coalesce(nullif(public.user_company_settings.company_name,''), excluded.company_name);

update public.user_company_settings ucs
set company_id = null
where company_id is not null
  and not exists (
    select 1 from public.companies c where c.id = ucs.company_id and c.owner_id = ucs.user_id
  );

create or replace function public.tp_role_permissions(p_role text)
returns text[]
language sql
stable
as $$
  select case p_role
    when 'owner' then array[
      'dashboard.read','company.read','company.update','members.manage','tabs.manage','audit.read',
      'clients.read','clients.create','clients.update','clients.delete',
      'projects.read','projects.create','projects.update','projects.delete',
      'budgets.read','budgets.create','budgets.update','budgets.delete',
      'contracts.read','contracts.create','production.read','production.update',
      'services.read','services.create','services.update','services.delete',
      'finance.read','finance.create','finance.update','finance.delete',
      'inventory.read','inventory.create','inventory.update','inventory.delete',
      'suppliers.read','suppliers.create','suppliers.update','suppliers.delete',
      'payroll.read','payroll.create','payroll.update','payroll.delete',
      'render.use','render.manage'
    ]::text[]
    when 'manager' then array[
      'dashboard.read','company.read',
      'clients.read','clients.create','clients.update',
      'projects.read','projects.create','projects.update',
      'budgets.read','budgets.create','budgets.update',
      'contracts.read','contracts.create','production.read','production.update',
      'services.read','services.create','services.update',
      'inventory.read','suppliers.read','render.use'
    ]::text[]
    when 'seller' then array[
      'dashboard.read','clients.read','clients.create','clients.update',
      'projects.read','projects.create','projects.update',
      'budgets.read','budgets.create','budgets.update',
      'contracts.read','contracts.create','services.read','services.create','services.update',
      'production.read','production.update','company.read'
    ]::text[]
    when 'finance' then array[
      'dashboard.read','company.read','clients.read','projects.read','budgets.read','contracts.read',
      'finance.read','finance.create','finance.update','finance.delete',
      'payroll.read','payroll.create','payroll.update','payroll.delete'
    ]::text[]
    when 'stock' then array[
      'dashboard.read','company.read','projects.read','production.read',
      'inventory.read','inventory.create','inventory.update','inventory.delete',
      'suppliers.read','suppliers.create','suppliers.update','suppliers.delete'
    ]::text[]
    when 'installer' then array[
      'dashboard.read','clients.read','projects.read','services.read','services.update','production.read','production.update'
    ]::text[]
    else array[]::text[]
  end;
$$;

create or replace function public.tp_current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select cm.company_id
  from public.company_members cm
  where cm.user_id = auth.uid() and cm.active = true
  order by cm.created_at asc
  limit 1;
$$;

create or replace function public.tp_has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.company_members cm
    join public.company_member_roles cmr on cmr.company_member_id = cm.id
    where cm.user_id = auth.uid() and cm.active = true and cmr.role = p_role
  );
$$;

create or replace function public.tp_has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.company_members cm
    join public.company_member_roles cmr on cmr.company_member_id = cm.id
    where cm.user_id = auth.uid()
      and cm.active = true
      and p_permission = any(public.tp_role_permissions(cmr.role))
  );
$$;

create or replace function public.tp_is_company_member(p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.company_members cm
    where cm.company_id = p_company and cm.user_id = auth.uid() and cm.active = true
  );
$$;

create or replace function public.tp_ensure_current_company()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company uuid;
  v_profile public.profiles;
  v_name text;
  v_member uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.id is null or coalesce(v_profile.active,false) = false then
    return null;
  end if;

  select public.tp_current_company_id() into v_company;
  if v_company is not null then
    return v_company;
  end if;

  -- Só admin antigo cria empresa automaticamente. Usuário comum precisa ser vinculado pelo dono.
  if v_profile.role <> 'admin' then
    return null;
  end if;

  select coalesce(nullif(company_name,''),'Top Planejados') into v_name
  from public.user_company_settings
  where user_id = auth.uid()
  limit 1;

  insert into public.companies(name, owner_id)
  values (coalesce(v_name,'Top Planejados'), auth.uid())
  returning id into v_company;

  insert into public.company_members(company_id, user_id, active)
  values (v_company, auth.uid(), true)
  on conflict (company_id, user_id) do update set active = true, updated_at = now()
  returning id into v_member;

  insert into public.company_member_roles(company_member_id, role)
  values (v_member, 'owner')
  on conflict do nothing;

  update public.user_company_settings set company_id = v_company where user_id = auth.uid() and company_id is null;

  return v_company;
end;
$$;

grant execute on function public.tp_role_permissions(text) to authenticated;
grant execute on function public.tp_current_company_id() to authenticated;
grant execute on function public.tp_has_role(text) to authenticated;
grant execute on function public.tp_has_permission(text) to authenticated;
grant execute on function public.tp_is_company_member(uuid) to authenticated;
grant execute on function public.tp_ensure_current_company() to authenticated;

create or replace function public.tp_my_company_context()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company uuid;
  v_roles text[] := array[]::text[];
  v_permissions text[] := array[]::text[];
  v_company_name text := '';
begin
  v_company := public.tp_ensure_current_company();

  if v_company is null then
    return jsonb_build_object('company_id', null, 'company_name', '', 'roles', array[]::text[], 'permissions', array[]::text[]);
  end if;

  select coalesce(c.name,'Top Planejados') into v_company_name from public.companies c where c.id = v_company;

  select coalesce(array_agg(distinct cmr.role order by cmr.role), array[]::text[])
  into v_roles
  from public.company_members cm
  join public.company_member_roles cmr on cmr.company_member_id = cm.id
  where cm.company_id = v_company and cm.user_id = auth.uid() and cm.active = true;

  select coalesce(array_agg(distinct perm order by perm), array[]::text[])
  into v_permissions
  from unnest(v_roles) as r(role)
  cross join lateral unnest(public.tp_role_permissions(r.role)) as p(perm);

  return jsonb_build_object('company_id', v_company, 'company_name', v_company_name, 'roles', v_roles, 'permissions', v_permissions);
end;
$$;

grant execute on function public.tp_my_company_context() to authenticated;

create or replace function public.tp_company_set_member_roles(p_target_user uuid, p_roles text[], p_active boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company uuid;
  v_member uuid;
  v_roles text[];
  v_target record;
  v_is_target_owner boolean := false;
begin
  v_company := public.tp_ensure_current_company();

  if v_company is null or not public.tp_has_permission('members.manage') then
    raise exception 'Sem permissão para gerenciar funcionários.';
  end if;

  select id, email, raw_user_meta_data into v_target from auth.users where id = p_target_user;
  if v_target.id is null then
    raise exception 'Usuário não encontrado no Auth.';
  end if;

  select exists (
    select 1 from public.companies c where c.id = v_company and c.owner_id = p_target_user
  ) into v_is_target_owner;

  if v_is_target_owner and auth.uid() <> p_target_user then
    raise exception 'O dono principal não pode ser alterado por outro usuário.';
  end if;

  select coalesce(array_agg(distinct r), array['seller']::text[])
  into v_roles
  from unnest(coalesce(p_roles, array[]::text[])) r
  where r in ('owner','manager','seller','finance','stock','installer');

  if v_roles is null or array_length(v_roles,1) is null then
    v_roles := array['seller']::text[];
  end if;

  insert into public.profiles(id, email, name, role, active)
  values (
    p_target_user,
    coalesce(v_target.email,''),
    coalesce(v_target.raw_user_meta_data->>'name', v_target.email, ''),
    case when 'owner' = any(v_roles) then 'admin' else 'user' end,
    coalesce(p_active,false)
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(nullif(public.profiles.name,''), excluded.name),
      role = excluded.role,
      active = excluded.active,
      updated_at = now();

  insert into public.company_members(company_id, user_id, active)
  values (v_company, p_target_user, coalesce(p_active,false))
  on conflict (company_id, user_id) do update
  set active = excluded.active,
      updated_at = now()
  returning id into v_member;

  delete from public.company_member_roles where company_member_id = v_member;
  insert into public.company_member_roles(company_member_id, role)
  select v_member, r from unnest(v_roles) r
  on conflict do nothing;

  return jsonb_build_object('user_id', p_target_user, 'company_id', v_company, 'roles', v_roles, 'active', coalesce(p_active,false));
end;
$$;

grant execute on function public.tp_company_set_member_roles(uuid,text[],boolean) to authenticated;

create or replace function public.tp_admin_list_users_v3()
returns table (
  id uuid,
  name text,
  email text,
  role text,
  active boolean,
  created_at timestamptz,
  has_profile boolean,
  company_id uuid,
  company_active boolean,
  roles text[],
  permissions text[]
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company uuid;
begin
  v_company := public.tp_ensure_current_company();

  if v_company is null or not public.tp_has_permission('members.manage') then
    raise exception 'Somente o dono pode listar e liberar funcionários.';
  end if;

  return query
  select
    u.id,
    coalesce(nullif(p.name,''), u.raw_user_meta_data->>'name', u.email, '')::text as name,
    coalesce(p.email, u.email, '')::text as email,
    coalesce(p.role, 'user')::text as role,
    coalesce(p.active, false)::boolean as active,
    coalesce(p.created_at, u.created_at)::timestamptz as created_at,
    (p.id is not null)::boolean as has_profile,
    cm.company_id,
    coalesce(cm.active, false)::boolean as company_active,
    coalesce((select array_agg(cmr.role order by cmr.role) from public.company_member_roles cmr where cmr.company_member_id = cm.id), array[]::text[]) as roles,
    coalesce((
      select array_agg(distinct perm order by perm)
      from public.company_member_roles cmr
      cross join lateral unnest(public.tp_role_permissions(cmr.role)) as p(perm)
      where cmr.company_member_id = cm.id
    ), array[]::text[]) as permissions
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.company_members cm on cm.user_id = u.id and cm.company_id = v_company
  where cm.company_id = v_company or p.id is null or p.active = false or p.id = auth.uid()
  order by coalesce(p.created_at, u.created_at) desc;
end;
$$;

grant execute on function public.tp_admin_list_users_v3() to authenticated;

-- RLS das novas tabelas.
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_member_roles enable row level security;

drop policy if exists companies_member_select on public.companies;
create policy companies_member_select on public.companies for select using (public.tp_is_company_member(id));
drop policy if exists companies_owner_update on public.companies;
create policy companies_owner_update on public.companies for update using (public.tp_has_permission('company.update')) with check (public.tp_has_permission('company.update'));

drop policy if exists company_members_self_or_manager_select on public.company_members;
create policy company_members_self_or_manager_select on public.company_members for select using (user_id = auth.uid() or public.tp_has_permission('members.manage'));
drop policy if exists company_members_manager_all on public.company_members;
create policy company_members_manager_all on public.company_members for all using (public.tp_has_permission('members.manage')) with check (public.tp_has_permission('members.manage'));

drop policy if exists company_member_roles_select on public.company_member_roles;
create policy company_member_roles_select on public.company_member_roles for select using (exists (select 1 from public.company_members cm where cm.id = company_member_id and (cm.user_id = auth.uid() or public.tp_has_permission('members.manage'))));
drop policy if exists company_member_roles_manage on public.company_member_roles;
create policy company_member_roles_manage on public.company_member_roles for all using (public.tp_has_permission('members.manage')) with check (public.tp_has_permission('members.manage'));

-- Policies por empresa. Mantém as policies antigas de created_by como compatibilidade, mas remove admin global amplo nas tabelas operacionais.
-- Clientes
drop policy if exists clients_admin_select on public.clients;
drop policy if exists clients_admin_insert on public.clients;
drop policy if exists clients_admin_update on public.clients;
drop policy if exists clients_admin_delete on public.clients;
drop policy if exists clients_company_select on public.clients;
create policy clients_company_select on public.clients for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('clients.read'));
drop policy if exists clients_company_insert on public.clients;
create policy clients_company_insert on public.clients for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('clients.create'));
drop policy if exists clients_company_update on public.clients;
create policy clients_company_update on public.clients for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('clients.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('clients.update'));
drop policy if exists clients_company_delete on public.clients;
create policy clients_company_delete on public.clients for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('clients.delete'));

-- Projetos / orçamentos / contratos / produção
drop policy if exists projects_admin_select on public.projects;
drop policy if exists projects_admin_insert on public.projects;
drop policy if exists projects_admin_update on public.projects;
drop policy if exists projects_admin_delete on public.projects;
drop policy if exists projects_company_select on public.projects;
create policy projects_company_select on public.projects for select using (company_id = public.tp_current_company_id() and (public.tp_has_permission('projects.read') or public.tp_has_permission('budgets.read') or public.tp_has_permission('contracts.read') or public.tp_has_permission('production.read')));
drop policy if exists projects_company_insert on public.projects;
create policy projects_company_insert on public.projects for insert with check (company_id = public.tp_current_company_id() and (public.tp_has_permission('projects.create') or public.tp_has_permission('budgets.create')));
drop policy if exists projects_company_update on public.projects;
create policy projects_company_update on public.projects for update using (company_id = public.tp_current_company_id() and (public.tp_has_permission('projects.update') or public.tp_has_permission('budgets.update') or public.tp_has_permission('production.update'))) with check (company_id = public.tp_current_company_id() and (public.tp_has_permission('projects.update') or public.tp_has_permission('budgets.update') or public.tp_has_permission('production.update')));
drop policy if exists projects_company_delete on public.projects;
create policy projects_company_delete on public.projects for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('projects.delete'));

-- Serviços
drop policy if exists services_admin_select on public.services;
drop policy if exists services_admin_insert on public.services;
drop policy if exists services_admin_update on public.services;
drop policy if exists services_admin_delete on public.services;
drop policy if exists services_company_select on public.services;
create policy services_company_select on public.services for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('services.read'));
drop policy if exists services_company_insert on public.services;
create policy services_company_insert on public.services for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('services.create'));
drop policy if exists services_company_update on public.services;
create policy services_company_update on public.services for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('services.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('services.update'));
drop policy if exists services_company_delete on public.services;
create policy services_company_delete on public.services for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('services.delete'));

-- Financeiro
drop policy if exists transactions_admin_select on public.transactions;
drop policy if exists transactions_admin_insert on public.transactions;
drop policy if exists transactions_admin_update on public.transactions;
drop policy if exists transactions_admin_delete on public.transactions;
drop policy if exists transactions_company_select on public.transactions;
create policy transactions_company_select on public.transactions for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('finance.read'));
drop policy if exists transactions_company_insert on public.transactions;
create policy transactions_company_insert on public.transactions for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('finance.create'));
drop policy if exists transactions_company_update on public.transactions;
create policy transactions_company_update on public.transactions for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('finance.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('finance.update'));
drop policy if exists transactions_company_delete on public.transactions;
create policy transactions_company_delete on public.transactions for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('finance.delete'));

-- Estoque
drop policy if exists inventory_items_admin_select on public.inventory_items;
drop policy if exists inventory_items_admin_insert on public.inventory_items;
drop policy if exists inventory_items_admin_update on public.inventory_items;
drop policy if exists inventory_items_admin_delete on public.inventory_items;
drop policy if exists inventory_company_select on public.inventory_items;
create policy inventory_company_select on public.inventory_items for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('inventory.read'));
drop policy if exists inventory_company_insert on public.inventory_items;
create policy inventory_company_insert on public.inventory_items for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('inventory.create'));
drop policy if exists inventory_company_update on public.inventory_items;
create policy inventory_company_update on public.inventory_items for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('inventory.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('inventory.update'));
drop policy if exists inventory_company_delete on public.inventory_items;
create policy inventory_company_delete on public.inventory_items for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('inventory.delete'));

-- Fornecedores
drop policy if exists suppliers_admin_select on public.suppliers;
drop policy if exists suppliers_admin_insert on public.suppliers;
drop policy if exists suppliers_admin_update on public.suppliers;
drop policy if exists suppliers_admin_delete on public.suppliers;
drop policy if exists suppliers_company_select on public.suppliers;
create policy suppliers_company_select on public.suppliers for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('suppliers.read'));
drop policy if exists suppliers_company_insert on public.suppliers;
create policy suppliers_company_insert on public.suppliers for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('suppliers.create'));
drop policy if exists suppliers_company_update on public.suppliers;
create policy suppliers_company_update on public.suppliers for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('suppliers.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('suppliers.update'));
drop policy if exists suppliers_company_delete on public.suppliers;
create policy suppliers_company_delete on public.suppliers for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('suppliers.delete'));

-- Funcionários / folha
drop policy if exists payroll_employees_admin_select on public.payroll_employees;
drop policy if exists payroll_employees_admin_insert on public.payroll_employees;
drop policy if exists payroll_employees_admin_update on public.payroll_employees;
drop policy if exists payroll_employees_admin_delete on public.payroll_employees;
drop policy if exists payroll_employees_company_select on public.payroll_employees;
create policy payroll_employees_company_select on public.payroll_employees for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.read'));
drop policy if exists payroll_employees_company_insert on public.payroll_employees;
create policy payroll_employees_company_insert on public.payroll_employees for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.create'));
drop policy if exists payroll_employees_company_update on public.payroll_employees;
create policy payroll_employees_company_update on public.payroll_employees for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.update'));
drop policy if exists payroll_employees_company_delete on public.payroll_employees;
create policy payroll_employees_company_delete on public.payroll_employees for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.delete'));

drop policy if exists payroll_records_admin_select on public.payroll_records;
drop policy if exists payroll_records_admin_insert on public.payroll_records;
drop policy if exists payroll_records_admin_update on public.payroll_records;
drop policy if exists payroll_records_admin_delete on public.payroll_records;
drop policy if exists payroll_records_company_select on public.payroll_records;
create policy payroll_records_company_select on public.payroll_records for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.read'));
drop policy if exists payroll_records_company_insert on public.payroll_records;
create policy payroll_records_company_insert on public.payroll_records for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.create'));
drop policy if exists payroll_records_company_update on public.payroll_records;
create policy payroll_records_company_update on public.payroll_records for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.update'));
drop policy if exists payroll_records_company_delete on public.payroll_records;
create policy payroll_records_company_delete on public.payroll_records for delete using (company_id = public.tp_current_company_id() and public.tp_has_permission('payroll.delete'));

-- Configurações da empresa compartilhadas.
drop policy if exists user_company_admin_select on public.user_company_settings;
drop policy if exists user_company_admin_insert on public.user_company_settings;
drop policy if exists user_company_admin_update on public.user_company_settings;
drop policy if exists user_company_admin_delete on public.user_company_settings;
drop policy if exists user_company_company_select on public.user_company_settings;
create policy user_company_company_select on public.user_company_settings for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('company.read'));
drop policy if exists user_company_company_insert on public.user_company_settings;
create policy user_company_company_insert on public.user_company_settings for insert with check (company_id = public.tp_current_company_id() and public.tp_has_permission('company.update'));
drop policy if exists user_company_company_update on public.user_company_settings;
create policy user_company_company_update on public.user_company_settings for update using (company_id = public.tp_current_company_id() and public.tp_has_permission('company.update')) with check (company_id = public.tp_current_company_id() and public.tp_has_permission('company.update'));

-- Logs: inserir se ativo; ler somente quem gerencia equipe/auditoria.
drop policy if exists logs_select_company_admin on public.security_logs;
create policy logs_select_company_admin on public.security_logs for select using (company_id = public.tp_current_company_id() and public.tp_has_permission('audit.read'));

-- Perfil: usuário vê ele mesmo; dono vê membros para gerenciar.
drop policy if exists profiles_company_select on public.profiles;
create policy profiles_company_select on public.profiles for select using (id = auth.uid() or public.tp_has_permission('members.manage'));
drop policy if exists profiles_company_update on public.profiles;
create policy profiles_company_update on public.profiles for update using (public.tp_has_permission('members.manage')) with check (public.tp_has_permission('members.manage'));

-- Logo PNG padrão em melhor qualidade para documentos, sem forçar sobre quem já configurou uma logo.
update public.user_company_settings
set logo_url = 'assets/logo-top-planejados.png'
where logo_url is null or trim(logo_url) = '';

-- Atualiza abas para não confundir cargo com ferramenta.
insert into public.tab_settings (tab_key,title,description,icon,enabled,admin_only,order_index) values
('company','Empresa','Dados oficiais, documentos, preços e equipe de acesso.','EM',true,false,120),
('admin','Admin','Área técnica: abas, integração e auditoria.','AD',true,true,130),
('designer','Projeto 3D','Ferramenta técnica de projeto 2D/3D, sem ser cargo de funcionário.','3D',false,false,100)
on conflict (tab_key) do update set
  title=excluded.title,
  description=excluded.description,
  icon=excluded.icon,
  enabled=excluded.enabled,
  admin_only=excluded.admin_only,
  order_index=excluded.order_index,
  updated_at=now();

create table if not exists public.app_migrations (
  version text primary key,
  description text,
  applied_at timestamptz default now()
);

alter table public.app_migrations add column if not exists description text;
alter table public.app_migrations add column if not exists applied_at timestamptz default now();
alter table public.app_migrations enable row level security;

insert into public.app_migrations(version, description)
values ('v114', 'Empresa, cargos múltiplos, permissões por módulo, company_id nos dados e correções de sincronização do app.')
on conflict (version) do update set description=excluded.description, applied_at=now();

select 'v114 empresa/cargos/permissões ok' as status;
