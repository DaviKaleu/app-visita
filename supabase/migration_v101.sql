
-- Top Planejados V101 - Liberação de usuários e recuperação do administrador
-- Rode no Supabase SQL Editor. Não apaga dados.
-- Corrige: conta criada em outro PC não aparecer no Admin e conta admin ficar bloqueada.

create extension if not exists pgcrypto;

-- 1) Todo usuário novo do Auth ganha perfil automaticamente bloqueado para aprovação.
create or replace function public.tp_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, name, role, active)
  values (
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'name', new.email, ''),
    'user',
    false
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(nullif(public.profiles.name,''), excluded.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_top_profiles on auth.users;
create trigger on_auth_user_created_top_profiles
after insert on auth.users
for each row execute function public.tp_handle_new_user();

-- 2) Cria perfis pendentes para contas antigas que já existem no Auth e ainda não aparecem no Admin.
insert into public.profiles (id, email, name, role, active)
select
  u.id,
  coalesce(u.email,''),
  coalesce(u.raw_user_meta_data->>'name', u.email, ''),
  'user',
  false
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 3) Recuperação segura do administrador principal da Top.
insert into public.profiles (id, email, name, role, active)
select
  u.id,
  coalesce(u.email,''),
  coalesce(u.raw_user_meta_data->>'name', u.email, ''),
  'admin',
  true
from auth.users u
where lower(coalesce(u.email,'')) = lower('davikaleu1537@gmail.com')
on conflict (id) do update
set role = 'admin',
    active = true,
    email = excluded.email,
    name = coalesce(nullif(public.profiles.name,''), excluded.name),
    updated_at = now();

-- 4) Autorreparo: se o e-mail principal entrar e estiver bloqueado, o app consegue reativar.
create or replace function public.tp_owner_self_repair()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  p public.profiles;
begin
  select id, email, raw_user_meta_data
  into u
  from auth.users
  where id = auth.uid();

  if u.id is null then
    raise exception 'Usuário não encontrado no Auth.';
  end if;

  if lower(coalesce(u.email,'')) <> lower('davikaleu1537@gmail.com') then
    raise exception 'Este e-mail não tem permissão de autorreparo.';
  end if;

  insert into public.profiles (id, email, name, role, active)
  values (u.id, coalesce(u.email,''), coalesce(u.raw_user_meta_data->>'name', u.email, ''), 'admin', true)
  on conflict (id) do update
  set role='admin', active=true, email=excluded.email, updated_at=now();

  select * into p from public.profiles where id = u.id;
  return p;
end;
$$;

grant execute on function public.tp_owner_self_repair() to authenticated;

-- 5) Garante perfil próprio quando a inserção pelo navegador falhar.
create or replace function public.tp_ensure_current_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  p public.profiles;
begin
  select id, email, raw_user_meta_data into u from auth.users where id = auth.uid();
  if u.id is null then raise exception 'Usuário não encontrado.'; end if;

  insert into public.profiles (id, email, name, role, active)
  values (u.id, coalesce(u.email,''), coalesce(u.raw_user_meta_data->>'name', u.email, ''), 'user', false)
  on conflict (id) do update
  set email=excluded.email,
      name=coalesce(nullif(public.profiles.name,''), excluded.name),
      updated_at=now();

  select * into p from public.profiles where id = u.id;
  return p;
end;
$$;

grant execute on function public.tp_ensure_current_profile() to authenticated;

-- 6) Lista usuários do Auth + perfil. Assim contas criadas em outro PC aparecem no Admin.
create or replace function public.tp_admin_list_users()
returns table (
  id uuid,
  name text,
  email text,
  role text,
  active boolean,
  created_at timestamptz,
  has_profile boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() and not exists (
    select 1 from auth.users u where u.id = auth.uid() and lower(coalesce(u.email,'')) = lower('davikaleu1537@gmail.com')
  ) then
    raise exception 'Somente administrador pode listar usuários.';
  end if;

  return query
  select
    u.id,
    coalesce(nullif(p.name,''), u.raw_user_meta_data->>'name', u.email, '')::text as name,
    coalesce(p.email, u.email, '')::text as email,
    coalesce(p.role, 'user')::text as role,
    coalesce(p.active, false)::boolean as active,
    coalesce(p.created_at, u.created_at)::timestamptz as created_at,
    (p.id is not null)::boolean as has_profile
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by coalesce(p.created_at, u.created_at) desc;
end;
$$;

grant execute on function public.tp_admin_list_users() to authenticated;

-- 7) Libera/bloqueia usuário criando perfil automaticamente quando necessário.
create or replace function public.tp_admin_set_user_access(target_user uuid, new_role text, new_active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  p public.profiles;
  clean_role text := case when new_role = 'admin' then 'admin' else 'user' end;
begin
  if not public.is_admin() and not exists (
    select 1 from auth.users au where au.id = auth.uid() and lower(coalesce(au.email,'')) = lower('davikaleu1537@gmail.com')
  ) then
    raise exception 'Somente administrador pode liberar usuários.';
  end if;

  select id, email, raw_user_meta_data into u from auth.users where id = target_user;
  if u.id is null then raise exception 'Usuário não encontrado no Auth.'; end if;

  insert into public.profiles (id, email, name, role, active)
  values (u.id, coalesce(u.email,''), coalesce(u.raw_user_meta_data->>'name', u.email, ''), clean_role, coalesce(new_active,false))
  on conflict (id) do update
  set role=clean_role,
      active=coalesce(new_active,false),
      email=excluded.email,
      name=coalesce(nullif(public.profiles.name,''), excluded.name),
      updated_at=now();

  select * into p from public.profiles where id = target_user;
  return p;
end;
$$;

grant execute on function public.tp_admin_set_user_access(uuid,text,boolean) to authenticated;

select 'v101 usuários ok' as status;
