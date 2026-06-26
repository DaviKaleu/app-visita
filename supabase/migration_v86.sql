-- Top Planejados V86 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Adiciona equipe de funcionários por serviço na folha de pagamento.

alter table public.services
  add column if not exists payroll_employee_ids jsonb not null default '[]'::jsonb,
  add column if not exists payroll_paid_map jsonb not null default '{}'::jsonb;

-- Migra serviços antigos com apenas um funcionário responsável para a nova equipe.
update public.services
set payroll_employee_ids = jsonb_build_array(payroll_employee_id)
where payroll_employee_id is not null
  and (payroll_employee_ids is null or jsonb_array_length(payroll_employee_ids) = 0);

-- Se já estava pago no modelo antigo, marca o funcionário antigo como pago no novo mapa.
update public.services
set payroll_paid_map = jsonb_build_object(payroll_employee_id::text, true)
where payroll_employee_id is not null
  and payroll_paid = true
  and (payroll_paid_map is null or payroll_paid_map = '{}'::jsonb);

insert into public.tab_settings(tab_key,title,description,icon,enabled,admin_only,order_index)
values
('payroll','Folha de pagamento','Funcionários recebem por equipe de serviço; cada funcionário pode ficar pago ou pendente separadamente.','FP',true,false,55)
on conflict (tab_key) do update
set title = excluded.title,
    description = excluded.description,
    icon = excluded.icon,
    enabled = true,
    admin_only = false,
    order_index = excluded.order_index;
