-- Top Planejados V84 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Adiciona estoque, folha de pagamento e uso do saldo fornecedor.

create extension if not exists pgcrypto;

alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('entrada','saida','credito_loja'));

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  category text default '',
  unit text default 'un',
  current_qty numeric(12,2) not null default 0,
  min_qty numeric(12,2) not null default 0,
  avg_cost numeric(12,2) not null default 0,
  supplier text default '',
  notes text default '',
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  pay_type text not null default 'percentual' check (pay_type in ('percentual','semanal','mensal','fixo')),
  percent_value numeric(8,2) not null default 0,
  fixed_value numeric(12,2) not null default 0,
  service_id uuid references public.services(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  base_value numeric(12,2) not null default 0,
  calculated_value numeric(12,2) not null default 0,
  period_start date default current_date,
  period_end date,
  status text not null default 'pendente' check (status in ('pendente','pago')),
  paid_at date,
  notes text default '',
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;
alter table public.payroll_records enable row level security;

drop policy if exists inventory_owner_select on public.inventory_items;
drop policy if exists inventory_owner_insert on public.inventory_items;
drop policy if exists inventory_owner_update on public.inventory_items;
drop policy if exists inventory_owner_delete on public.inventory_items;
create policy inventory_owner_select on public.inventory_items for select using (created_by = auth.uid());
create policy inventory_owner_insert on public.inventory_items for insert with check (created_by = auth.uid());
create policy inventory_owner_update on public.inventory_items for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy inventory_owner_delete on public.inventory_items for delete using (created_by = auth.uid());

drop policy if exists payroll_owner_select on public.payroll_records;
drop policy if exists payroll_owner_insert on public.payroll_records;
drop policy if exists payroll_owner_update on public.payroll_records;
drop policy if exists payroll_owner_delete on public.payroll_records;
create policy payroll_owner_select on public.payroll_records for select using (created_by = auth.uid());
create policy payroll_owner_insert on public.payroll_records for insert with check (created_by = auth.uid());
create policy payroll_owner_update on public.payroll_records for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy payroll_owner_delete on public.payroll_records for delete using (created_by = auth.uid());

drop trigger if exists inventory_touch on public.inventory_items;
create trigger inventory_touch before update on public.inventory_items for each row execute function public.touch_updated_at();
drop trigger if exists payroll_touch on public.payroll_records;
create trigger payroll_touch before update on public.payroll_records for each row execute function public.touch_updated_at();

insert into public.tab_settings (tab_key,title,description,icon,enabled,admin_only,order_index) values
('inventory','Controle de estoque','Controle simples de itens como chapas MDF, corrediças, ferragens, cores e fornecedores.','ES',true,false,52),
('payroll','Folha de pagamento','Funcionários, comissão por serviço, salário fixo semanal/mensal, pendências e pagamentos.','FP',true,false,55)
on conflict (tab_key) do update set
  title=excluded.title,
  description=excluded.description,
  icon=excluded.icon,
  enabled=excluded.enabled,
  admin_only=excluded.admin_only,
  order_index=excluded.order_index;

update public.tab_settings
set title = 'Financeiro',
    description = 'Entradas, saídas, crédito na loja/fornecedor e compras descontadas do saldo fornecedor.'
where tab_key = 'finance';

update public.tab_settings
set title = 'Serviços',
    description = 'Controle serviços com status orçando, fechado e entregue; ao selecionar projeto puxa o valor automaticamente.'
where tab_key = 'services';

update public.tab_settings
set title = 'Estatísticas da empresa',
    description = 'Faturamento, despesas, saldo no fornecedor, folha, estoque, lucro, ticket, pipeline, conversão e atrasos.'
where tab_key = 'leaderboard';
