-- Top Planejados V63 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Pode rodar mais de uma vez. Ele cria/atualiza tabelas, colunas, abas, planos e políticas.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null default 'user' check (role in ('admin','user')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_company_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null default 'Top Planejados',
  document_number text default '',
  responsible_name text default '',
  phone text default '',
  whatsapp text default '',
  instagram text default '',
  address text default '',
  pix_key text default '',
  contract_city text default 'Porto Velho - RO',
  price_white numeric(12,2) not null default 850,
  price_white_wood numeric(12,2) not null default 950,
  price_wood numeric(12,2) not null default 1100,
  card_factor numeric(8,3) not null default 1.30,
  default_discount numeric(12,2) not null default 0,
  entry_pct numeric(8,2) not null default 50,
  delivery_pct numeric(8,2) not null default 50,
  logo_url text default '',
  quote_primary_color text default '#111111',
  quote_secondary_color text default '#8b8b8b',
  quote_accent_color text default '#dc2626',
  quote_text_color text default '#111827',
  quote_title text default 'ORÇAMENTO DE SERVIÇO',
  quote_valid_days integer default 7,
  quote_warranty text default '',
  quote_footer_note text default '',
  updated_at timestamptz not null default now()
);

-- Mantém compatibilidade caso você já tenha rodado versões antigas com company_settings global.
create table if not exists public.company_settings (
  id boolean primary key default true,
  company_name text not null default 'Top Planejados',
  document_number text default '',
  responsible_name text default '',
  phone text default '',
  whatsapp text default '',
  instagram text default '',
  address text default '',
  pix_key text default '',
  contract_city text default 'Porto Velho - RO',
  price_white numeric(12,2) not null default 850,
  price_white_wood numeric(12,2) not null default 950,
  price_wood numeric(12,2) not null default 1100,
  card_factor numeric(8,3) not null default 1.30,
  default_discount numeric(12,2) not null default 0,
  entry_pct numeric(8,2) not null default 50,
  delivery_pct numeric(8,2) not null default 50,
  logo_url text default '',
  quote_primary_color text default '#111111',
  quote_secondary_color text default '#8b8b8b',
  quote_accent_color text default '#dc2626',
  quote_text_color text default '#111827',
  quote_title text default 'ORÇAMENTO DE SERVIÇO',
  quote_valid_days integer default 7,
  quote_warranty text default '',
  quote_footer_note text default '',
  updated_at timestamptz not null default now()
);
insert into public.company_settings (id) values (true) on conflict (id) do nothing;

alter table public.user_company_settings add column if not exists logo_url text default '';
alter table public.user_company_settings add column if not exists quote_primary_color text default '#111111';
alter table public.user_company_settings add column if not exists quote_secondary_color text default '#8b8b8b';
alter table public.user_company_settings add column if not exists quote_accent_color text default '#dc2626';
alter table public.user_company_settings add column if not exists quote_text_color text default '#111827';
alter table public.user_company_settings add column if not exists quote_title text default 'ORÇAMENTO DE SERVIÇO';
alter table public.user_company_settings add column if not exists quote_valid_days integer default 7;
alter table public.user_company_settings add column if not exists quote_warranty text default '';
alter table public.user_company_settings add column if not exists quote_footer_note text default '';


create table if not exists public.render_settings (
  id boolean primary key default true,
  provider text default 'myarchitectai-proxy',
  public_endpoint text default '',
  admin_notes text default '',
  api_key_reference text default '',
  ready boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.tab_settings (
  tab_key text primary key,
  title text not null,
  description text not null default '',
  icon text not null default '•',
  enabled boolean not null default true,
  admin_only boolean not null default false,
  order_index integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  city text default '',
  address text default '',
  source text default '',
  status text not null default 'ativo',
  notes text default '',
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  environment text default '',
  colors text default '',
  status text not null default 'orcamento',
  budget_value numeric(12,2) not null default 0,
  cost_value numeric(12,2) not null default 0,
  paid_value numeric(12,2) not null default 0,
  budget_items jsonb not null default '[]'::jsonb,
  budget_discount numeric(12,2) not null default 0,
  entry_pct numeric(8,2),
  delivery_pct numeric(8,2),
  contract_start date,
  delivery_days integer not null default 30,
  design_data jsonb,
  pieces_data jsonb not null default '[]'::jsonb,
  delivery_deadline date,
  notes text default '',
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects add column if not exists budget_items jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists budget_discount numeric(12,2) not null default 0;
alter table public.projects add column if not exists entry_pct numeric(8,2);
alter table public.projects add column if not exists delivery_pct numeric(8,2);
alter table public.projects add column if not exists contract_start date;
alter table public.projects add column if not exists delivery_days integer not null default 30;
alter table public.projects add column if not exists design_data jsonb;
alter table public.projects add column if not exists pieces_data jsonb not null default '[]'::jsonb;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  status text not null default 'orcando',
  value numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  started_at date default current_date,
  closed_at date,
  notes text default '',
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  type text not null check (type in ('entrada','saida')),
  category text default '',
  description text not null default '',
  amount numeric(12,2) not null default 0,
  transaction_date date not null default current_date,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('inicial','profissional')),
  plan_name text not null default '',
  daily_limit integer not null default 10,
  status text not null default 'solicitado' check (status in ('solicitado','ativo','cancelado','pago','aprovado')),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.render_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_request_id uuid references public.plan_requests(id) on delete set null,
  usage_date date not null default current_date,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, usage_date)
);

create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.render_settings (id, provider, public_endpoint, admin_notes, ready) values
(true, 'myarchitectai-proxy', '', 'Preparado para conectar uma API/proxy do MyArchitectAI. Não salve chave secreta no navegador.', false)
on conflict (id) do nothing;

insert into public.tab_settings (tab_key,title,description,icon,enabled,admin_only,order_index) values
('leaderboard','Estatísticas da empresa','Faturamento confirmado, despesas, lucro, margem, ticket médio, pipeline, crescimento e serviços.','ST',true,false,10),
('company','Empresa','Dados particulares da empresa deste usuário e valores por metro usados em contratos e orçamentos.','EM',true,false,15),
('clients','Clientes','Cadastro, pesquisa e acompanhamento de clientes.','CL',true,false,20),
('projects','Projetos','Organize projetos, imagens e dados técnicos.','PR',true,false,30),
('budget','Orçamentos','Monte orçamento com ou sem projeto vinculado.','OR',true,false,40),
('designer','Projetista 3D','Projetista simples de móveis planejados: ambiente, módulos, 2D/3D, peças e orçamento.','3D',true,false,38),
('services','Serviços','Controle serviços com status orçando, fechado e entregue.','SV',true,false,40),
('finance','Financeiro','Entradas, saídas, categorias e histórico financeiro.','FI',true,false,50),
('contracts','Contratos','Geração de contrato usando somente dados do usuário logado.','CT',true,false,60),
('render','Render API','Área preparada para API futura parecida com MyArchitectAI e planos de renderização.','AI',false,false,70),
('admin','Admin','Controle global de abas, usuários, planos comprados e integração futura de API.','AD',true,true,90)
on conflict (tab_key) do update set
  title=excluded.title,
  description=excluded.description,
  icon=excluded.icon,
  order_index=excluded.order_index;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists user_company_touch on public.user_company_settings;
create trigger user_company_touch before update on public.user_company_settings for each row execute function public.touch_updated_at();
drop trigger if exists company_touch on public.company_settings;
create trigger company_touch before update on public.company_settings for each row execute function public.touch_updated_at();
drop trigger if exists render_touch on public.render_settings;
create trigger render_touch before update on public.render_settings for each row execute function public.touch_updated_at();
drop trigger if exists tab_touch on public.tab_settings;
create trigger tab_touch before update on public.tab_settings for each row execute function public.touch_updated_at();
drop trigger if exists clients_touch on public.clients;
create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
drop trigger if exists services_touch on public.services;
create trigger services_touch before update on public.services for each row execute function public.touch_updated_at();
drop trigger if exists plan_requests_touch on public.plan_requests;
create trigger plan_requests_touch before update on public.plan_requests for each row execute function public.touch_updated_at();
drop trigger if exists render_usage_touch on public.render_usage;
create trigger render_usage_touch before update on public.render_usage for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and active = true);
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active = true);
$$;

alter table public.profiles enable row level security;
alter table public.user_company_settings enable row level security;
alter table public.company_settings enable row level security;
alter table public.render_settings enable row level security;
alter table public.tab_settings enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.transactions enable row level security;
alter table public.plan_requests enable row level security;
alter table public.render_usage enable row level security;
alter table public.security_logs enable row level security;

-- Perfis: usuário vê o próprio; admin vê e ativa usuários.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid() and role = 'user' and active = false);
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Empresa individual por usuário.
drop policy if exists user_company_select_own on public.user_company_settings;
create policy user_company_select_own on public.user_company_settings for select using (user_id = auth.uid() and public.is_active_user());
drop policy if exists user_company_insert_own on public.user_company_settings;
create policy user_company_insert_own on public.user_company_settings for insert with check (user_id = auth.uid() and public.is_active_user());
drop policy if exists user_company_update_own on public.user_company_settings;
create policy user_company_update_own on public.user_company_settings for update using (user_id = auth.uid() and public.is_active_user()) with check (user_id = auth.uid() and public.is_active_user());

-- Tabela antiga global só fica por compatibilidade; app novo não usa.
drop policy if exists company_select_active on public.company_settings;
create policy company_select_active on public.company_settings for select using (public.is_active_user());
drop policy if exists company_update_active on public.company_settings;
create policy company_update_active on public.company_settings for update using (public.is_admin()) with check (public.is_admin());

-- Configurações globais controladas pelo admin.
drop policy if exists render_select_admin on public.render_settings;
create policy render_select_admin on public.render_settings for select using (public.is_active_user());
drop policy if exists render_admin_update on public.render_settings;
create policy render_admin_update on public.render_settings for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists tabs_select_active on public.tab_settings;
create policy tabs_select_active on public.tab_settings for select using (public.is_active_user());
drop policy if exists tabs_admin_update on public.tab_settings;
create policy tabs_admin_update on public.tab_settings for update using (public.is_admin()) with check (public.is_admin());

-- Dados privados: cada usuário só acessa o que criou.
drop policy if exists clients_all_active on public.clients;
drop policy if exists clients_own on public.clients;
create policy clients_own on public.clients for all using (created_by = auth.uid() and public.is_active_user()) with check (created_by = auth.uid() and public.is_active_user());
drop policy if exists projects_all_active on public.projects;
drop policy if exists projects_own on public.projects;
create policy projects_own on public.projects for all using (created_by = auth.uid() and public.is_active_user()) with check (created_by = auth.uid() and public.is_active_user());
drop policy if exists services_all_active on public.services;
drop policy if exists services_own on public.services;
create policy services_own on public.services for all using (created_by = auth.uid() and public.is_active_user()) with check (created_by = auth.uid() and public.is_active_user());
drop policy if exists transactions_all_active on public.transactions;
drop policy if exists transactions_own on public.transactions;
create policy transactions_own on public.transactions for all using (created_by = auth.uid() and public.is_active_user()) with check (created_by = auth.uid() and public.is_active_user());

-- Planos: usuário solicita e vê os próprios; admin vê/ativa/cancela todos.
drop policy if exists plan_requests_select on public.plan_requests;
create policy plan_requests_select on public.plan_requests for select using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());
drop policy if exists plan_requests_insert_own on public.plan_requests;
create policy plan_requests_insert_own on public.plan_requests for insert with check (user_id = auth.uid() and public.is_active_user());
drop policy if exists plan_requests_update_admin on public.plan_requests;
create policy plan_requests_update_admin on public.plan_requests for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists render_usage_select on public.render_usage;
create policy render_usage_select on public.render_usage for select using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());
drop policy if exists render_usage_insert_own on public.render_usage;
create policy render_usage_insert_own on public.render_usage for insert with check (user_id = auth.uid() and public.is_active_user());
drop policy if exists render_usage_update_own on public.render_usage;
create policy render_usage_update_own on public.render_usage for update using (user_id = auth.uid() and public.is_active_user()) with check (user_id = auth.uid() and public.is_active_user());

-- Logs.
drop policy if exists logs_insert_active on public.security_logs;
create policy logs_insert_active on public.security_logs for insert with check (public.is_active_user());
drop policy if exists logs_select_admin on public.security_logs;
create policy logs_select_admin on public.security_logs for select using (public.is_admin());

-- Depois de criar seu primeiro usuário pelo app, rode este comando trocando o e-mail:
-- insert into public.profiles (id,email,name,role,active)
-- select id,email,coalesce(raw_user_meta_data->>'name',email),'admin',true
-- from auth.users where lower(email)=lower('SEU_EMAIL_AQUI')
-- on conflict (id) do update set role='admin', active=true, email=excluded.email;

-- ===================== V99 Operação - complemento =====================
-- Mantido idempotente para novas instalações e atualizações.
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
('projects','Projetos','Organize projetos, imagens e dados técnicos.','PR',true,false,30),
('budget','Orçamentos','Monte orçamento com ou sem projeto vinculado.','OR',true,false,40),
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



-- Top Planejados V101 - Liberação de usuários e recuperação do administrador
-- Rode no Supabase SQL Editor. Não apaga dados.
-- Corrige: conta criada em outro PC não aparecer no Admin e conta admin ficar bloqueada.

create extension if not exists pgcrypto;

-- 1) Todo usuário novo do Auth ganha perfil automaticamente bloqueado para aprovação.
create or replace function public.tp_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, name, role, active)
  values (
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'name', new.email, ''),
    'user',
    false
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(nullif(public.profiles.name,''), excluded.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_top_profiles on auth.users;
create trigger on_auth_user_created_top_profiles
after insert on auth.users
for each row execute function public.tp_handle_new_user();

-- 2) Cria perfis pendentes para contas antigas que já existem no Auth e ainda não aparecem no Admin.
insert into public.profiles (id, email, name, role, active)
select
  u.id,
  coalesce(u.email,''),
  coalesce(u.raw_user_meta_data->>'name', u.email, ''),
  'user',
  false
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 3) Recuperação segura do administrador principal da Top.
insert into public.profiles (id, email, name, role, active)
select
  u.id,
  coalesce(u.email,''),
  coalesce(u.raw_user_meta_data->>'name', u.email, ''),
  'admin',
  true
from auth.users u
where lower(coalesce(u.email,'')) = lower('davikaleu1537@gmail.com')
on conflict (id) do update
set role = 'admin',
    active = true,
    email = excluded.email,
    name = coalesce(nullif(public.profiles.name,''), excluded.name),
    updated_at = now();

-- 4) Autorreparo: se o e-mail principal entrar e estiver bloqueado, o app consegue reativar.
create or replace function public.tp_owner_self_repair()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  p public.profiles;
begin
  select id, email, raw_user_meta_data
  into u
  from auth.users
  where id = auth.uid();

  if u.id is null then
    raise exception 'Usuário não encontrado no Auth.';
  end if;

  if lower(coalesce(u.email,'')) <> lower('davikaleu1537@gmail.com') then
    raise exception 'Este e-mail não tem permissão de autorreparo.';
  end if;

  insert into public.profiles (id, email, name, role, active)
  values (u.id, coalesce(u.email,''), coalesce(u.raw_user_meta_data->>'name', u.email, ''), 'admin', true)
  on conflict (id) do update
  set role='admin', active=true, email=excluded.email, updated_at=now();

  select * into p from public.profiles where id = u.id;
  return p;
end;
$$;

grant execute on function public.tp_owner_self_repair() to authenticated;

-- 5) Garante perfil próprio quando a inserção pelo navegador falhar.
create or replace function public.tp_ensure_current_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  p public.profiles;
begin
  select id, email, raw_user_meta_data into u from auth.users where id = auth.uid();
  if u.id is null then raise exception 'Usuário não encontrado.'; end if;

  insert into public.profiles (id, email, name, role, active)
  values (u.id, coalesce(u.email,''), coalesce(u.raw_user_meta_data->>'name', u.email, ''), 'user', false)
  on conflict (id) do update
  set email=excluded.email,
      name=coalesce(nullif(public.profiles.name,''), excluded.name),
      updated_at=now();

  select * into p from public.profiles where id = u.id;
  return p;
end;
$$;

grant execute on function public.tp_ensure_current_profile() to authenticated;

-- 6) Lista usuários do Auth + perfil. Assim contas criadas em outro PC aparecem no Admin.
create or replace function public.tp_admin_list_users()
returns table (
  id uuid,
  name text,
  email text,
  role text,
  active boolean,
  created_at timestamptz,
  has_profile boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() and not exists (
    select 1 from auth.users u where u.id = auth.uid() and lower(coalesce(u.email,'')) = lower('davikaleu1537@gmail.com')
  ) then
    raise exception 'Somente administrador pode listar usuários.';
  end if;

  return query
  select
    u.id,
    coalesce(nullif(p.name,''), u.raw_user_meta_data->>'name', u.email, '')::text as name,
    coalesce(p.email, u.email, '')::text as email,
    coalesce(p.role, 'user')::text as role,
    coalesce(p.active, false)::boolean as active,
    coalesce(p.created_at, u.created_at)::timestamptz as created_at,
    (p.id is not null)::boolean as has_profile
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by coalesce(p.created_at, u.created_at) desc;
end;
$$;

grant execute on function public.tp_admin_list_users() to authenticated;

-- 7) Libera/bloqueia usuário criando perfil automaticamente quando necessário.
create or replace function public.tp_admin_set_user_access(target_user uuid, new_role text, new_active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u record;
  p public.profiles;
  clean_role text := case when new_role = 'admin' then 'admin' else 'user' end;
begin
  if not public.is_admin() and not exists (
    select 1 from auth.users au where au.id = auth.uid() and lower(coalesce(au.email,'')) = lower('davikaleu1537@gmail.com')
  ) then
    raise exception 'Somente administrador pode liberar usuários.';
  end if;

  select id, email, raw_user_meta_data into u from auth.users where id = target_user;
  if u.id is null then raise exception 'Usuário não encontrado no Auth.'; end if;

  insert into public.profiles (id, email, name, role, active)
  values (u.id, coalesce(u.email,''), coalesce(u.raw_user_meta_data->>'name', u.email, ''), clean_role, coalesce(new_active,false))
  on conflict (id) do update
  set role=clean_role,
      active=coalesce(new_active,false),
      email=excluded.email,
      name=coalesce(nullif(public.profiles.name,''), excluded.name),
      updated_at=now();

  select * into p from public.profiles where id = target_user;
  return p;
end;
$$;

grant execute on function public.tp_admin_set_user_access(uuid,text,boolean) to authenticated;

select 'v101 usuários ok' as status;
