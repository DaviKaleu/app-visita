-- Top Planejados V64 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Esta migration não apaga dados. Ela só atualiza descrições de abas e mantém compatibilidade.

update public.tab_settings
set title = 'Projetista 3D Pro',
    description = 'Projetista técnico inspirado em fluxo profissional: ambiente, módulos sólidos, vistas 3D/frontal/planta, snap, cotas, peças, imagem e orçamento.',
    enabled = true,
    order_index = 38
where tab_key = 'designer';

update public.tab_settings
set title = 'Render API',
    description = 'Preparado para API futura do MyArchitectAI via endpoint/proxy seguro, com planos e limites de renderização.'
where tab_key = 'render';

-- Mantém Estatísticas com nome correto.
update public.tab_settings
set title = 'Estatísticas da empresa',
    description = 'Faturamento confirmado, despesas, lucro, margem, ticket médio, pipeline, crescimento, conversão e atrasos.'
where tab_key = 'leaderboard';
