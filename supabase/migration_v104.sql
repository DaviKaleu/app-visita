-- Top Planejados V104 Online
-- Projeto antes de orçamento + orçamento sem projeto obrigatório + estoque padrão editável.
-- Rode apenas esta migration se seu banco já está atualizado até a V103.

create extension if not exists pgcrypto;

-- Garante colunas usadas por orçamento/projeto/produção.
alter table if exists public.projects
  add column if not exists project_status text default 'em_criacao',
  add column if not exists production_status text default 'nao_iniciado',
  add column if not exists budget_payment_note text default '',
  add column if not exists project_images text default '';

alter table if exists public.inventory_items
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists variant_text text default '',
  add column if not exists variants jsonb default '{}'::jsonb;

-- Reorganiza o menu: Projetos antes de Orçamentos.
insert into public.tab_settings (tab_key,title,description,icon,enabled,admin_only,order_index)
values
  ('projects','Projetos','Organize projetos, imagens e dados técnicos.','PR',true,false,30),
  ('budget','Orçamentos','Monte orçamento com ou sem projeto vinculado.','OR',true,false,40)
on conflict (tab_key) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  enabled = excluded.enabled,
  admin_only = excluded.admin_only,
  order_index = excluded.order_index,
  updated_at = now();

update public.tab_settings set order_index = 30, title='Projetos' where tab_key='projects';
update public.tab_settings set order_index = 40, title='Orçamentos', description='Monte orçamento com ou sem projeto vinculado.' where tab_key='budget';

-- Normaliza registros antigos sem status novo.
update public.projects set project_status = coalesce(project_status, 'em_criacao') where project_status is null or trim(project_status) = '';
update public.projects set production_status = coalesce(production_status, 'nao_iniciado') where production_status is null or trim(production_status) = '';
