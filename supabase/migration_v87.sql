-- Top Planejados V87 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Atualiza descrições e garante compatibilidade com equipe por serviço.

alter table if exists public.services add column if not exists payroll_employee_ids jsonb default '[]'::jsonb;
alter table if exists public.services add column if not exists payroll_paid_map jsonb default '{}'::jsonb;

update public.tab_settings
set title = 'Serviços',
    description = 'Controle serviços, equipe que recebe por serviço e valor automático para folha de pagamento.'
where tab_key = 'services';

update public.tab_settings
set title = 'Folha de pagamento',
    description = 'Funcionários recebem por equipe de serviço; cada pagamento fica pago ou pendente separadamente.'
where tab_key = 'payroll';
