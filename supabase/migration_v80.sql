-- Top Planejados V80 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Corrige compatibilidade/textos da V80.

update public.tab_settings
set title = 'Projetista 3D Pro',
    description = 'Correção de carregamento: eventos do projetista restaurados, sem tela preta, mantendo orçamento modelo e personalização.',
    enabled = true,
    order_index = 38
where tab_key = 'designer';

update public.tab_settings
set title = 'Render API',
    description = 'Preparado para API futura do MyArchitectAI via endpoint/proxy seguro, com planos, limites diários e aprovação pelo admin.'
where tab_key = 'render';

update public.tab_settings
set title = 'Estatísticas da empresa',
    description = 'Faturamento confirmado, despesas, lucro, margem, ticket médio, pipeline, crescimento, conversão e atrasos.'
where tab_key = 'leaderboard';
