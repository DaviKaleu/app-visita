# Atualizar para V64

1. Faça backup da pasta atual.
2. Extraia a V64 em uma nova pasta.
3. Copie seu arquivo `src/config.js` da versão antiga para a nova.
4. No Supabase, abra **SQL Editor > New query**.
5. Cole o conteúdo de `supabase/migration_v64.sql`.
6. Clique em **Run**.
7. Abra o app novo e aperte **Ctrl + F5**.

Não rode o `schema.sql` de novo se você já está usando o sistema.
