# Atualizar para V109

Rode somente este arquivo no Supabase SQL Editor:

```sql
supabase/migration_v109.sql
```

Essa migration não apaga dados. Ela apenas registra a versão e garante que a tabela `app_migrations` tenha as colunas necessárias.

Se aparecer aviso de RLS, escolha **Execute e habilite o RLS**.
