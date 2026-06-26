# Top Planejados V104.1 Online

Versão V104 atualizada com:

- Projetos antes de Orçamentos.
- Orçamento sem projeto obrigatório, com projeto opcional.
- Lista padrão de estoque para marcenaria.
- Recibo gerado pela aba Contratos.
- Acesso assistido de administrador para carregar dados de outro usuário e corrigir registros.

## Como atualizar

1. Copie seu `src/config.js` da versão antiga para esta pasta.
2. Rode no Supabase, se ainda não rodou:

```sql
supabase/migration_v104.sql
```

3. Rode também:

```sql
supabase/migration_v104_recibo_admin.sql
```

4. Se usa Netlify/GitHub, envie para o repositório:

```txt
index.html
assets/
src/
supabase/
docs/
README.md
netlify.toml
```

5. Faça novo deploy e pressione Ctrl + F5 no navegador.

## Recibo no contrato

Na aba Contratos:

1. Selecione cliente e projeto/orçamento.
2. Preencha valor recebido, forma de pagamento e referência do recibo.
3. Clique em **Gerar recibo**.
4. Clique em **PDF do recibo** para imprimir ou salvar.

## Acesso assistido de usuário

Na aba Admin:

1. Vá em Usuários.
2. Clique em **Acessar dados** no usuário desejado.
3. O app carrega os dados daquela conta.
4. Faça as alterações necessárias.
5. Clique em **Voltar para minha conta**.

Esse recurso não mostra senha e não entra no Auth do usuário. Ele apenas permite ao admin carregar e corrigir dados vinculados à conta selecionada.
