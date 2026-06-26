# Atualizar Supabase para V106

Rode este arquivo no SQL Editor do Supabase:

```sql
supabase/migration_v106.sql
```

A migration adiciona apenas os campos de modelo visual do contrato e recibo:

- `contract_model`
- `receipt_model`

Ela não apaga clientes, projetos, orçamentos, estoque nem financeiro.
