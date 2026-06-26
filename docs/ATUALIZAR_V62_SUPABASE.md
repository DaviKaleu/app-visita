# Atualizar o banco para V62

Use este arquivo se você já configurou o Supabase antes.

1. Entre no Supabase.
2. Abra seu projeto.
3. Vá em **SQL Editor**.
4. Clique em **New query**.
5. Abra no computador o arquivo `supabase/migration_v62.sql`.
6. Copie todo o conteúdo.
7. Cole no SQL Editor.
8. Clique em **Run**.

Depois, abra o app V62 e aperte `Ctrl + F5`.

## O que essa migração faz

- Cria dados de empresa individuais por usuário.
- Ajusta políticas RLS para cada usuário ver somente os próprios clientes, projetos, orçamentos, contratos, serviços e financeiro.
- Cria planos de renderização.
- Cria controle de uso diário de render.
- Renomeia a aba Leader Board para Estatísticas da empresa.
- Mantém a aba Render API preparada para MyArchitectAI via endpoint/proxy.
