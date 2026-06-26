# Atualizar o Supabase para V61

Você já tinha rodado o primeiro SQL da V60. Agora rode apenas:

```txt
supabase/migration_v61.sql
```

Caminho no Supabase:

1. Abra seu projeto.
2. Vá em **SQL Editor**.
3. Clique em **New query**.
4. Copie tudo do arquivo `supabase/migration_v61.sql`.
5. Clique em **Run**.
6. Atualize o app com Ctrl + F5.

Esse SQL adiciona:

- colunas de orçamento em `projects`;
- colunas de projetista 3D e peças em `projects`;
- preços da planilha em `company_settings`;
- abas `Empresa`, `Orçamento` e `Projetista 3D`;
- política para usuário ativo editar dados da empresa.

Se der erro, copie a mensagem vermelha do Supabase e mande para mim.
