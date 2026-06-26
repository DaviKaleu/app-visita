# Atualizar V103

A V103 corrige a atualização da tela Admin após liberar, bloquear ou mudar cargo de usuário.

1. Copie o `src/config.js` da sua versão atual.
2. Rode `supabase/migration_v103.sql` se quiser manter histórico de atualização.
3. Abra o app e pressione Ctrl+F5.

Se as funções de usuário ainda não existirem no banco, rode também `migration_v101.sql` e `migration_v102.sql`.
