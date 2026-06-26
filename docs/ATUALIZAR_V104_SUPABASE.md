# Atualizar Supabase para V104

Rode somente este arquivo se seu banco já está na V103:

```sql
supabase/migration_v104.sql
```

Essa migration não apaga dados. Ela apenas:

- coloca **Projetos** antes de **Orçamentos** no menu;
- garante colunas usadas por orçamento, projeto, produção e estoque;
- mantém o orçamento podendo ser criado sem projeto obrigatório.

A lista padrão de estoque é criada pelo próprio app para cada usuário quando o estoque estiver vazio. Também existe o botão **Adicionar lista padrão de marcenaria** dentro da aba Estoque.
