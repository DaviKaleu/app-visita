-- Top Planejados V106 - Contrato, recibo e projeto vinculado ao cliente
-- Rode após a migration_v105.sql.

alter table public.user_company_settings
  add column if not exists contract_model text default 'comercial',
  add column if not exists receipt_model text default 'comercial';

update public.user_company_settings
set
  contract_model = coalesce(nullif(contract_model, ''), 'comercial'),
  receipt_model = coalesce(nullif(receipt_model, ''), 'comercial');

-- Não altera dados de clientes, projetos, orçamento ou estoque.
-- A importação de móveis do cliente para o projeto é feita pelo app usando os itens já salvos em projects.budget_items.
