# Atualizar para V100 Operação

1. Abra o Supabase.
2. Vá em **SQL Editor**.
3. Rode o arquivo:

```sql
supabase/migration_v100.sql
```

Essa atualização não apaga dados. Ela apenas:

- oculta a aba Projetista do fluxo principal;
- garante campos de fornecedor, forma de pagamento e anexo no financeiro;
- mantém Renderização como integração opcional separada.
