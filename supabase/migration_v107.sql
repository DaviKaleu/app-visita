-- Top Planejados V107 - Orçamento limpo e projeto automático
-- Esta versão não exige novas colunas obrigatórias.
-- Mantém histórico para controle de atualização.

create table if not exists public.app_migrations (
  version text primary key,
  applied_at timestamptz default now(),
  notes text
);

insert into public.app_migrations (version, notes)
values ('v107', 'Orçamento limpo, anexos condicionais e projeto técnico automático ao criar orçamento.')
on conflict (version) do update set applied_at = now(), notes = excluded.notes;
