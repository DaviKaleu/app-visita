-- Top Planejados V85 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Simplifica folha de pagamento por funcionário e serviço.

create extension if not exists pgcrypto;

create table if not exists public.payroll_employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  payment_mode text not null default 'percentual' check (payment_mode in ('percentual','valor_servico')),
  percent_value numeric(8,2) not null default 0,
  service_fixed_value numeric(12,2) not null default 0,
  active boolean not null default true,
  notes text default '',
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services
  add column if not exists payroll_employee_id uuid references public.payroll_employees(id) on delete set null,
  add column if not exists payroll_paid boolean not null default false,
  add column if not exists payroll_paid_at date;

alter table public.payroll_employees enable row level security;

drop policy if exists payroll_employees_owner_select on public.payroll_employees;
drop policy if exists payroll_employees_owner_insert on public.payroll_employees;
drop policy if exists payroll_employees_owner_update on public.payroll_employees;
drop policy if exists payroll_employees_owner_delete on public.payroll_employees;
create policy payroll_employees_owner_select on public.payroll_employees for select using (created_by = auth.uid());
create policy payroll_employees_owner_insert on public.payroll_employees for insert with check (created_by = auth.uid());
create policy payroll_employees_owner_update on public.payroll_employees for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy payroll_employees_owner_delete on public.payroll_employees for delete using (created_by = auth.uid());

drop trigger if exists payroll_employees_touch on public.payroll_employees;
create trigger payroll_employees_touch before update on public.payroll_employees for each row execute function public.touch_updated_at();

insert into public.tab_settings (tab_key,title,description,icon,enabled,admin_only,order_index) values
('payroll','Folha de pagamento','Cadastro simples de funcionários; pagamentos gerados automaticamente pelos serviços vinculados, com status pago ou faltando pagar.','FP',true,false,55)
on conflict (tab_key) do update set
  title=excluded.title,
  description=excluded.description,
  icon=excluded.icon,
  enabled=excluded.enabled,
  admin_only=excluded.admin_only,
  order_index=excluded.order_index;

update public.tab_settings
set title = 'Serviços',
    description = 'Controle serviços, funcionário responsável e valor automático para folha de pagamento.'
where tab_key = 'services';

update public.tab_settings
set title = 'Estatísticas da empresa',
    description = 'Faturamento, despesas, saldo fornecedor, folha pendente/paga, estoque, lucro, ticket, pipeline, conversão e atrasos.'
where tab_key = 'leaderboard';
