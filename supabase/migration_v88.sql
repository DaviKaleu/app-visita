-- Top Planejados V88 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Adiciona campos de compatibilidade da V88.

alter table if exists public.clients
  add column if not exists document_number text default '',
  add column if not exists city text default '',
  add column if not exists address text default '',
  add column if not exists source text default '',
  add column if not exists notes text default '',
  add column if not exists status text default 'ativo';

alter table if exists public.projects
  add column if not exists budget_payment_note text default '';

alter table if exists public.services
  add column if not exists payroll_employee_ids jsonb default '[]'::jsonb,
  add column if not exists payroll_paid_map jsonb default '{}'::jsonb,
  add column if not exists payroll_release_mode text default 'status';

update public.tab_settings
set title='Serviços',
    description='Controle serviços, equipe que recebe por serviço, valor automático e liberação de folha por status ou somente na entrega.'
where tab_key='services';

update public.tab_settings
set title='Folha de pagamento',
    description='Funcionários recebem por equipe de serviço; opção de receber somente quando o serviço for entregue.'
where tab_key='payroll';
