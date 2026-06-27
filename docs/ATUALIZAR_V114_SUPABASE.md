# Atualizar Supabase para V114

Esta atualização cria segurança por empresa, membros e cargos múltiplos.

## Ordem

Rode no Supabase SQL Editor:

```txt
supabase/migration_v114_company_roles_permissions.sql
```

Não rode `schema.sql` em banco existente.

## O que muda

- Cria `companies`.
- Cria `company_members`.
- Cria `company_member_roles`.
- Permite mais de um cargo por pessoa.
- Remove o cargo `Projetista` da regra de cargos.
- Mantém a ferramenta de projeto como recurso técnico, não como cargo.
- Adiciona `company_id` em clientes, projetos, orçamento, serviços, financeiro, estoque, fornecedores e folha.
- Mantém `created_by` como auditoria e compatibilidade.
- Cria RPCs:
  - `tp_my_company_context`
  - `tp_company_set_member_roles`
  - `tp_admin_list_users_v3`
- Troca permissões principais para empresa + cargo.

## Cargos iniciais

- Dono
- Gerente
- Vendedor
- Financeiro
- Estoque / compras
- Montagem

## Onde liberar funcionário

No app:

```txt
Empresa > Equipe e acesso ao sistema
```

A aba `Funcionários` continua sendo para folha/valor por serviço. Não misturar acesso do sistema com pagamento de funcionário, porque isso é como guardar parafuso junto com contrato assinado.

## Depois de rodar

1. Recarregue o app com `Ctrl + F5`.
2. Entre como dono/admin.
3. Vá em `Empresa`.
4. Use `Equipe e acesso ao sistema` para liberar usuários e marcar cargos.
5. Teste com um usuário vendedor.

## Teste mínimo

- Vendedor cria cliente.
- Vendedor cria orçamento.
- Vendedor gera contrato.
- Vendedor não vê financeiro.
- Vendedor não gerencia equipe.
- Financeiro vê financeiro e folha.
- Estoque vê estoque e fornecedores.
- Dono vê tudo.
