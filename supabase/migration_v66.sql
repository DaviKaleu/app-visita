-- Top Planejados V66 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Esta migration não apaga dados. Ela só atualiza descrições/compatibilidade da V66.

update public.tab_settings
set title = 'Projetista 3D Pro',
    description = 'Projetista técnico com câmera orbital por arraste, ambiente 3D mais sólido, sombras, módulos com materiais visuais e vistas técnica/planta.',
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
