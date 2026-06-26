# Atualização V104.1 — Recibo e Admin Assistido

Rode este arquivo no Supabase SQL Editor depois da `migration_v104.sql`:

```sql
supabase/migration_v104_recibo_admin.sql
```

## O que libera

- Administrador pode acessar dados de outro usuário pela aba Admin usando o botão **Acessar dados**.
- O modo assistido carrega clientes, projetos, orçamentos, serviços, financeiro, estoque, fornecedores e configurações daquele usuário.
- Novos registros criados nesse modo ficam vinculados ao usuário selecionado.
- Usuário comum continua vendo somente os próprios dados.

## Observação

Isso não revela a senha do usuário e não entra no Auth dele. É um modo seguro de suporte/admin para corrigir dados da conta.
