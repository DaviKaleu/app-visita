-- Top Planejados V65 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Esta migration não apaga dados. Ela só atualiza textos/descrições das abas para a V65.

update public.tab_settings
set title = 'Projetista 3D Pro',
    description = 'Projetista técnico com módulos sólidos, portas/gavetas mais inteligentes, materiais com cor e veio, vistas frontal/planta/3D e câmeras laterais.' ,
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
