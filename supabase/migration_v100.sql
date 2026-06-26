-- Top Planejados V100 Operação
-- Rode no Supabase SQL Editor. Não apaga dados.
-- Foco: remover aba Projetista do fluxo, melhorar financeiro/fornecedor e anexos.

-- Esconde o Projetista do menu principal. O histórico de projetos e orçamento continua preservado.
update public.tab_settings
set enabled = false,
    updated_at = now()
where tab_key = 'designer';

-- Garante campos necessários para cupom/anexo e fornecedor em movimentações financeiras.
alter table if exists public.transactions
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists supplier text default '',
  add column if not exists payment_method text default '',
  add column if not exists notes text default '',
  add column if not exists receipt_url text default '',
  add column if not exists purchase_date date;

-- Mantém Renderização separada e opcional.
update public.tab_settings
set title='Renderização',
    description='Renderização opcional via API externa. Separada do fluxo principal.',
    enabled=false,
    updated_at=now()
where tab_key='render';

select 'v100 ok' as status;
