-- Top Planejados V78 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Corrige compatibilidade da V78 e mantém o modelo de orçamento.

update public.tab_settings
set title = 'Projetista 3D Pro',
    description = 'Projetista técnico com cuba plana, materiais, exportação e orçamento personalizado.',
    enabled = true,
    order_index = 38
where tab_key = 'designer';

update public.tab_settings
set title = 'Orçamento',
    description = 'Geração de orçamento/contrato em modelo personalizado com dados da empresa, cliente, itens, pagamento, prazo e anexos.'
where tab_key = 'budget';

update public.tab_settings
set title = 'Admin',
    enabled = true,
    admin_only = true
where tab_key = 'admin';
