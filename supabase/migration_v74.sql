-- Top Planejados V74 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Ajusta a lógica visual das abas e remove o uso da opção admin_only.

-- A aba Admin continua fixa para administradores.
-- Usuários comuns nunca veem Admin.
update public.tab_settings
set enabled = true,
    admin_only = true,
    title = 'Admin',
    description = 'Controle global de usuários, planos, integração futura da API e abas visíveis para usuários.'
where tab_key = 'admin';

-- Garante que o campo admin_only antigo não esconda abas do administrador.
-- A partir da V74 o app usa enabled apenas como “visível para usuários comuns”.
update public.tab_settings
set admin_only = false
where tab_key <> 'admin';

update public.tab_settings
set title = 'Projetista 3D Pro',
    description = 'Projetista técnico com abertura total de portas/gavetas, soclo respeitado, seleção melhor da cuba e câmera orbital mais livre.',
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
