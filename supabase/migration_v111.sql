-- Top Planejados V111
-- Ajuste de registro de versão. Não altera dados operacionais.

create table if not exists public.app_migrations (
  version text primary key,
  description text,
  applied_at timestamptz default now()
);

alter table public.app_migrations
add column if not exists description text;

alter table public.app_migrations
add column if not exists applied_at timestamptz default now();

alter table public.app_migrations enable row level security;

insert into public.app_migrations(version, description)
values ('v111', 'Layout compacto, estoque prático, pagamento de funcionários separado das saídas e ajustes nos métodos de pagamento do orçamento')
on conflict (version) do update set description = excluded.description;
