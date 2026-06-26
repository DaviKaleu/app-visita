-- Top Planejados V82 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Atualiza apenas textos/compatibilidade.

update public.tab_settings
set title = 'Orçamento',
    description = 'Orçamento comercial no modelo simples com dados do serviço, itens, total, observações e anexos.'
where tab_key = 'budget';

update public.tab_settings
set title = 'Contratos',
    description = 'Contrato com dados completos da empresa e do cliente, CPF/CNPJ, endereço, pagamento, prazo e garantia.'
where tab_key = 'contracts';

update public.tab_settings
set title = 'Financeiro',
    description = 'Entradas, saídas e crédito na loja/fornecedor.'
where tab_key = 'finance';

update public.tab_settings
set title = 'Estatísticas da empresa',
    description = 'Faturamento, despesas, saldo no fornecedor, lucro, ticket, pipeline, conversão e atrasos.'
where tab_key = 'leaderboard';
