-- Top Planejados V110
-- Correção de front-end. Nenhuma alteração obrigatória no banco.

create table if not exists public.app_migrations (
  version text primary key,
  description text,
  applied_at timestamptz default now()
);

alter table public.app_migrations add column if not exists description text;
alter table public.app_migrations add column if not exists applied_at timestamptz default now();

insert into public.app_migrations(version, description)
values ('v110', 'Correção da função remover item do orçamento no front-end.')
on conflict (version) do update set description=excluded.description;
