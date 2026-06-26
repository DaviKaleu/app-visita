# Atualizar para V101 - Usuários e liberação no Admin

Rode o arquivo `supabase/migration_v101.sql` no SQL Editor do Supabase.

Esta migration corrige:

- conta criada em outro PC não aparecer na aba Admin;
- perfil não criado quando o cadastro falha por política/RLS;
- administrador principal bloqueado;
- liberação de usuário sem precisar rodar SQL manual.

Depois de rodar:

1. Entre com `davikaleu1537@gmail.com`.
2. Abra a aba **Admin**.
3. Clique em **Recarregar usuários**.
4. Ative a nova conta.
5. Se quiser, mude o cargo para `admin` ou deixe como `user`.

Se a conta principal ainda estiver bloqueada, rode novamente a migration_v101.sql e limpe o login salvo no app.
