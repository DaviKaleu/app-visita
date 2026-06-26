-- Top Planejados V109 - Contratos Flex / fluxo com projeto obrigatório
-- Esta migration não apaga dados. Ela apenas registra a versão e garante compatibilidade da tabela de migrations.

create table if not exists public.app_migrations (
  version text primary key,
  applied_at timestamptz default now()
);

alter table public.app_migrations
  add column if not exists description text;

alter table public.app_migrations
  add column if not exists applied_at timestamptz default now();

alter table public.app_migrations enable row level security;

drop policy if exists "app_migrations_select_authenticated" on public.app_migrations;
create policy "app_migrations_select_authenticated"
on public.app_migrations
for select
to authenticated
using (true);

insert into public.app_migrations(version, description)
values (
  'v109',
  'Fluxo de orçamento voltou a exigir projeto; contrato com cláusulas editáveis/importáveis; recibo e melhorias mantidos.'
)
on conflict (version) do update
set description = excluded.description,
    applied_at = now();
