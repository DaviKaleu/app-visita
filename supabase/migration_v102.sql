
-- Top Planejados V102 - Correção definitiva de liberação/bloqueio/admin de usuários
-- Rode no Supabase SQL Editor. Não apaga dados.
-- Corrige: não conseguir bloquear usuário, liberar usuário ou transformar em admin pela aba Admin.

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
set role='admin',
    active=true,
    email=excluded.email,
    name=coalesce(nullif(public.profiles.name,''), excluded.name),
    updated_at=now();

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

create or replace function public.tp_admin_can_manage()
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.active = true
  )
  or exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(coalesce(u.email,'')) = lower('davikaleu1537@gmail.com')
  );
$$;

grant execute on function public.tp_admin_can_manage() to authenticated;

create or replace function public.tp_admin_list_users_v2()
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
  if not public.tp_admin_can_manage() then
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

grant execute on function public.tp_admin_list_users_v2() to authenticated;

create or replace function public.tp_admin_set_user_access_v2(
  p_target_user uuid,
  p_role text,
  p_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  p public.profiles;
  clean_role text := case when lower(coalesce(p_role,'')) = 'admin' then 'admin' else 'user' end;
  clean_active boolean := coalesce(p_active,false);
begin
  if not public.tp_admin_can_manage() then
    raise exception 'Somente administrador pode liberar, bloquear ou alterar cargo de usuários.';
  end if;

  select id, email, raw_user_meta_data
  into u
  from auth.users
  where id = p_target_user;

  if u.id is null then
    raise exception 'Usuário não encontrado no Auth.';
  end if;

  if lower(coalesce(u.email,'')) = lower('davikaleu1537@gmail.com') then
    clean_role := 'admin';
    clean_active := true;
  end if;

  insert into public.profiles (id, email, name, role, active)
  values (
    u.id,
    coalesce(u.email,''),
    coalesce(u.raw_user_meta_data->>'name', u.email, ''),
    clean_role,
    clean_active
  )
  on conflict (id) do update
  set role = clean_role,
      active = clean_active,
      email = excluded.email,
      name = coalesce(nullif(public.profiles.name,''), excluded.name),
      updated_at = now();

  select * into p from public.profiles where id = p_target_user;
  return p;
end;
$$;

grant execute on function public.tp_admin_set_user_access_v2(uuid,text,boolean) to authenticated;

create or replace function public.tp_admin_set_user_access(target_user uuid, new_role text, new_active boolean)
returns public.profiles
language sql
security definer
set search_path = public, auth
as $$
  select public.tp_admin_set_user_access_v2(target_user, new_role, new_active);
$$;

grant execute on function public.tp_admin_set_user_access(uuid,text,boolean) to authenticated;

select 'v102 admin usuários ok' as status;
