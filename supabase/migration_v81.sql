-- Top Planejados V81 Online
-- Rode no Supabase: SQL Editor > New query > Run.
-- Não apaga dados. Adiciona CPF/CNPJ do cliente e imagem importada do projeto.

alter table public.clients
  add column if not exists document_number text default '';

alter table public.projects
  add column if not exists project_image_url text default '';

update public.tab_settings
set title = 'Clientes',
    description = 'Cadastro, pesquisa e acompanhamento de clientes com CPF/CNPJ para orçamento e contrato.'
where tab_key = 'clients';

update public.tab_settings
set title = 'Projetos',
    description = 'Crie vários projetos por cliente, importe imagem externa, acompanhe status, prazo e valores.'
where tab_key = 'projects';

update public.tab_settings
set title = 'Orçamento',
    description = 'Orçamento no modelo personalizado com dados do cliente, CPF/CNPJ, empresa, pagamento e anexos do projeto.'
where tab_key = 'budget';
