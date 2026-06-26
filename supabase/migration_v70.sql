-- Top Planejados V70 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Esta migration não apaga dados. Ela só atualiza descrições/compatibilidade da V70.

update public.tab_settings
set title = 'Projetista 3D Pro',
    description = 'Projetista técnico com regra correta de material: frente externa, corpo/interior interno, fita frontal externa nas laterais, portas/gavetas e peças agrupadas.',
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
