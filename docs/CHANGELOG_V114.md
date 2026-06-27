# Top Planejados V114

## Segurança / Supabase

- Adicionada estrutura de empresa.
- Adicionados membros da empresa.
- Adicionados múltiplos cargos por funcionário.
- Removido cargo `Projetista`.
- Criadas permissões por módulo.
- Dados principais passam a ter `company_id`.
- Policies novas usam empresa + permissão.
- `created_by` fica como compatibilidade/auditoria.

## Interface

- A área de liberar funcionário foi movida para `Empresa > Equipe e acesso ao sistema`.
- A aba `Funcionários` continua focada em folha/valor por serviço.
- A versão abaixo do nome agora mostra somente `V114`.

## Correções

- Corrigido cálculo de entrada/sinal quando a entrada é `0%`.
- Status de orçamento/projeto/produção agora atualiza o estado local imediatamente.
- Aprovar orçamento atualiza a tela sem depender de recarregar.
- Salvamento de orçamento ficou mais rápido no autosave.
- Removido salvamento duplicado de cliente.
- Upload da logo da empresa agora gera PNG com mais qualidade.
- Adicionada logo PNG padrão em `assets/logo-top-planejados.png`.

## Arquivos principais

- `src/app.js`
- `assets/app.css`
- `assets/logo-top-planejados.png`
- `service-worker.js`
- `supabase/migration_v114_company_roles_permissions.sql`
