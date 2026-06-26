# Atualizar para V99 Operação

1. Abra o Supabase.
2. Vá em SQL Editor.
3. Copie o conteúdo de `supabase/migration_v99.sql`.
4. Clique em Run.
5. Volte ao app, clique em Atualizar ou use Ctrl + F5.

Esta migration não apaga dados. Ela adiciona colunas/tabelas para:

- status separados de projeto e produção;
- fornecedores;
- anexos/observações no financeiro;
- variantes no estoque;
- catálogo básico de materiais;
- aba Produção;
- aba Fornecedores.
