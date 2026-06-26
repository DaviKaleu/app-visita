-- Top Planejados V108 - Fluxo rápido orçamento/projeto e recibo tabular
-- Esta migration não altera dados obrigatórios. Ela registra a versão aplicada.

create table if not exists public.app_migrations (
  version text primary key,
  description text,
  applied_at timestamptz default now()
);

alter table public.app_migrations enable row level security;

drop policy if exists "app_migrations_admin_read" on public.app_migrations;
create policy "app_migrations_admin_read" on public.app_migrations
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active = true));

insert into public.app_migrations(version, description)
values ('v108', 'Fluxo rápido: orçamento cria projeto técnico automático, anexos só com imagens, recibo tabular e status direto em projetos.')
on conflict (version) do update set description = excluded.description, applied_at = now();
