-- Top Planejados V99 Operação
-- Rode no Supabase SQL Editor. Não apaga dados.
-- Foco: salvar melhor, separar status, preparar produção/fornecedores/anexos.

create extension if not exists pgcrypto;

-- Status separados sem quebrar projetos antigos.
alter table if exists public.projects
  add column if not exists project_status text default 'em_criacao',
  add column if not exists production_status text default 'nao_iniciado';

update public.projects
set project_status = case
  when lower(coalesce(status,'')) in ('aprovado','producao','produção','finalizado') then 'aprovado'
  when lower(coalesce(status,'')) in ('enviado','negociacao','negociação') then 'aguardando_aprovacao'
  else coalesce(project_status,'em_criacao')
end
where project_status is null or project_status = '';

update public.projects
set production_status = case
  when lower(coalesce(status,'')) in ('producao','produção') then 'em_producao'
  when lower(coalesce(status,'')) in ('finalizado') then 'finalizado'
  else coalesce(production_status,'nao_iniciado')
end
where production_status is null or production_status = '';

-- Simplificação de status sem apagar histórico.
update public.clients set status='ativo' where status is null or trim(status)='' or lower(status) in ('negociacao','negociação','orcando','orçando');
update public.projects set status='rascunho' where status is null or trim(status)='' or lower(status) in ('orcamento','orçamento','orcando','orçando');
update public.projects set status='negociacao' where lower(status) in ('negociando','em negociação','em_negociacao','negociação');
update public.services set status='aguardando_inicio' where status is null or trim(status)='' or lower(status) in ('orcando','orçando','fechado');
update public.services set status='em_andamento' where lower(status) in ('andamento','em andamento','producao','produção');
update public.services set status='finalizado' where lower(status) in ('pago');

-- Fornecedores.
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  address text default '',
  material_type text default '',
  notes text default '',
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;
drop policy if exists suppliers_owner_select on public.suppliers;
drop policy if exists suppliers_owner_insert on public.suppliers;
drop policy if exists suppliers_owner_update on public.suppliers;
drop policy if exists suppliers_owner_delete on public.suppliers;
create policy suppliers_owner_select on public.suppliers for select using (created_by = auth.uid());
create policy suppliers_owner_insert on public.suppliers for insert with check (created_by = auth.uid());
create policy suppliers_owner_update on public.suppliers for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy suppliers_owner_delete on public.suppliers for delete using (created_by = auth.uid());

-- Financeiro com fornecedor, pagamento, observação e anexo de comprovante.
alter table if exists public.transactions
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists supplier text default '',
  add column if not exists payment_method text default '',
  add column if not exists notes text default '',
  add column if not exists receipt_url text default '',
  add column if not exists purchase_date date;

-- Estoque com variantes.
alter table if exists public.inventory_items
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists variant_text text default '',
  add column if not exists variants jsonb default '{}'::jsonb;

-- Catálogo reutilizável de materiais / ferragens.
create table if not exists public.material_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  unit text default 'un',
  default_supplier text default '',
  variant_schema jsonb default '{}'::jsonb,
  notes text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.material_catalog enable row level security;
drop policy if exists material_catalog_select on public.material_catalog;
create policy material_catalog_select on public.material_catalog for select using (true);

insert into public.material_catalog (name, category, unit, variant_schema, notes) values
('Chapa MDF', 'MDF', 'chapa', '{"cor":"texto","espessura":"mm","tamanho":"largura x altura","fabricante":"texto"}'::jsonb, 'Base para chapas MDF'),
('Corrediça telescópica', 'Ferragem', 'par', '{"tamanho":"mm","tipo":"texto","marca":"texto"}'::jsonb, 'Base para corrediças'),
('Dobradiça', 'Ferragem', 'un', '{"tipo":"texto","medida":"texto","acabamento":"texto"}'::jsonb, 'Base para dobradiças'),
('Fita de borda', 'Acabamento', 'metro', '{"cor":"texto","espessura":"mm","largura":"mm"}'::jsonb, 'Base para fitas')
on conflict do nothing;

-- Funcionários com dados simples extras.
alter table if exists public.payroll_employees
  add column if not exists role text default '',
  add column if not exists phone text default '';

-- Atualização das abas para o fluxo final.
insert into public.tab_settings (tab_key,title,description,icon,enabled,admin_only,order_index) values
('leaderboard','Dashboard / Estatísticas','Resumo simples da operação da empresa.','IN',true,false,10),
('clients','Clientes','Cadastro e pesquisa de clientes.','CL',true,false,20),
('budget','Orçamentos','Monte, revise e gere orçamento para o cliente.','OR',true,false,30),
('projects','Projetos','Organize projetos, imagens e dados técnicos.','PR',true,false,40),
('contracts','Contratos','Gere contratos após aprovação do orçamento.','CT',true,false,50),
('production','Produção','Acompanhe a produção após orçamento aprovado.','PD',true,false,55),
('services','Serviços','Acompanhe execução, equipe e entrega.','SV',true,false,60),
('finance','Financeiro','Controle entradas, despesas, compras e fornecedor.','FI',true,false,70),
('inventory','Estoque','Controle itens, variantes e estoque mínimo.','ES',true,false,80),
('suppliers','Fornecedores','Cadastro simples de fornecedores e lojas.','FO',true,false,85),
('payroll','Funcionários','Funcionários e valores por serviço.','FU',true,false,90),
('designer','Projetista','Ferramenta leve de apoio para projeto técnico.','PJ',true,false,100),
('render','Renderização','Renderização opcional via API externa no futuro.','AI',false,false,110),
('company','Configurações','Dados oficiais da empresa e documentos.','CF',true,false,120),
('admin','Admin','Usuários, permissões e abas.','AD',true,true,130)
on conflict (tab_key) do update set
  title=excluded.title,
  description=excluded.description,
  icon=excluded.icon,
  enabled=excluded.enabled,
  admin_only=excluded.admin_only,
  order_index=excluded.order_index,
  updated_at=now();

-- Garante que render continua separado e opcional.
insert into public.render_settings (id, provider, public_endpoint, admin_notes, ready)
values (true, 'proxy-interno', '', 'Preparado para API externa. Renderização separada do projetista leve.', false)
on conflict (id) do update set admin_notes=excluded.admin_notes;

select 'v99 ok' as status;
