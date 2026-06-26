-- Top Planejados V83 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Corrige crédito na loja/fornecedor e textos das abas.

alter table public.transactions
drop constraint if exists transactions_type_check;

alter table public.transactions
add constraint transactions_type_check
check (type in ('entrada','saida','credito_loja'));

update public.tab_settings
set title = 'Orçamento',
    description = 'Orçamento simples com dados de serviço, itens, valores, observações, logo e cores personalizáveis.'
where tab_key = 'budget';

update public.tab_settings
set title = 'Contratos',
    description = 'Contrato com dados completos da empresa e do cliente, CPF/CNPJ, endereço, pagamento, prazo e garantia.'
where tab_key = 'contracts';

update public.tab_settings
set title = 'Financeiro',
    description = 'Entradas, saídas/despesas e crédito na loja/fornecedor.'
where tab_key = 'finance';

update public.tab_settings
set title = 'Estatísticas da empresa',
    description = 'Faturamento, despesas, saldo no fornecedor, lucro, ticket, pipeline, conversão e atrasos.'
where tab_key = 'leaderboard';
