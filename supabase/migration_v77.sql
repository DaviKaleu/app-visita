-- Top Planejados V77 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Adiciona campos de personalização do orçamento/contrato.

alter table public.user_company_settings add column if not exists logo_url text default '';
alter table public.user_company_settings add column if not exists quote_primary_color text default '#111111';
alter table public.user_company_settings add column if not exists quote_secondary_color text default '#8b8b8b';
alter table public.user_company_settings add column if not exists quote_accent_color text default '#dc2626';
alter table public.user_company_settings add column if not exists quote_text_color text default '#111827';
alter table public.user_company_settings add column if not exists quote_title text default 'ORÇAMENTO DE SERVIÇO';
alter table public.user_company_settings add column if not exists quote_valid_days integer default 7;
alter table public.user_company_settings add column if not exists quote_warranty text default '';
alter table public.user_company_settings add column if not exists quote_footer_note text default '';

update public.tab_settings
set title = 'Empresa',
    description = 'Dados da empresa, preços e personalização de orçamento/contrato com logo, cores, garantia e validade.'
where tab_key = 'company';

update public.tab_settings
set title = 'Orçamento',
    description = 'Gera orçamento no modelo visual do contrato, usando dados do cliente, empresa, itens, pagamento e projeto.'
where tab_key = 'budget';
