-- Top Planejados V97 Clear
-- Organização de abas e textos para o fluxo operacional da Top.

update public.tab_settings set title='Início', description='Resumo simples da operação da Top: orçamentos, serviços, financeiro e pendências.', icon='IN', enabled=true, order_index=10 where tab_key='leaderboard';
update public.tab_settings set title='Empresa Top', description='Dados oficiais da Top e valores usados nos documentos.', icon='TP', enabled=true, order_index=15 where tab_key='company';
update public.tab_settings set title='Clientes', description='Cadastro principal dos clientes da Top.', icon='CL', enabled=true, order_index=20 where tab_key='clients';
update public.tab_settings set title='Orçamentos', description='Monte, revise e gere orçamento para o cliente.', icon='OR', enabled=true, order_index=30 where tab_key='budget';
update public.tab_settings set title='Projetos / Produção', description='Organize anexos, produção e informações técnicas do serviço.', icon='PR', enabled=true, order_index=40 where tab_key='projects';
update public.tab_settings set title='Contratos', description='Gere contratos a partir das informações já preenchidas.', icon='CT', enabled=true, order_index=50 where tab_key='contracts';
update public.tab_settings set title='Serviços', description='Acompanhe execução, equipe e entrega.', icon='SV', enabled=true, order_index=60 where tab_key='services';
update public.tab_settings set title='Financeiro', description='Controle entradas, saídas, fornecedor e pagamentos.', icon='FI', enabled=true, order_index=70 where tab_key='finance';
update public.tab_settings set title='Estoque', description='Controle de estoque e alertas internos.', icon='ES', enabled=true, order_index=80 where tab_key='inventory';
update public.tab_settings set title='Funcionários', description='Funcionários, regras de pagamento e pendências.', icon='FN', enabled=true, order_index=90 where tab_key='payroll';
update public.tab_settings set title='Projetista', description='Ferramenta de apoio para visual técnico simples.', icon='PJ', enabled=true, order_index=110 where tab_key='designer';
update public.tab_settings set title='Render API', description='Integração futura de renderização via API.', icon='AI', enabled=false, order_index=120 where tab_key='render';
update public.tab_settings set title='Admin', description='Usuários, permissões, abas e configurações internas.', icon='AD', enabled=true, order_index=130 where tab_key='admin';

select 'v97 clear ok' as status;
