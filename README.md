# Top Planejados V111 Online

Versão focada em layout mais leve, estoque mais prático e correções no fluxo de orçamento/financeiro.

## Mudanças principais

- Removida a opção de puxar móveis vinculados ao cliente dentro de Projetos.
- Mantido o fluxo: Cliente -> Projeto -> Orçamento.
- Métodos de pagamento do orçamento foram reorganizados e voltaram com as opções antigas.
- Troca de pagamento no orçamento agora salva mais rápido em segundo plano.
- Estoque ficou mais fácil de usar: botão de editar mais acessível e clique no item abre edição.
- Tabela do estoque ficou mais compacta, evitando precisar ir até o fim da tela para editar.
- Adicionado botão separado **Limpar estoque**, com confirmação dupla.
- Exclusões continuam pedindo confirmação, exceto remover item do orçamento.
- Pagamento de funcionários não entra mais em Saídas; agora fica em estatística própria.
- Dashboard ganhou estatística **Valor pago a funcionários**.
- Layout geral ficou mais compacto para caber mais informação na tela.
- Salvamento/sincronização com a nuvem ficou menos travado, em segundo plano.

## Como atualizar

Substitua no GitHub/Netlify:

```txt
index.html
assets/
src/
supabase/
docs/
README.md
netlify.toml
```

Depois rode no Supabase apenas:

```txt
supabase/migration_v111.sql
```

Se a atualização for só front-end e o SQL já rodou sem erro, basta aguardar o Netlify publicar e abrir com Ctrl + F5.

## Teste rápido

1. Abra Estoque e clique no nome de um item: deve abrir para editar.
2. Clique em Limpar estoque e confira se pede confirmação.
3. Abra Orçamentos e altere método de pagamento: deve atualizar/salvar sem travar.
4. Remova item do orçamento: não deve pedir confirmação.
5. Marque pagamento de funcionário: ele deve aparecer na estatística de funcionários, não em Saídas.


## V112 - PWA

Esta versão pode ser instalada como aplicativo pelo Chrome/Edge.

Arquivos adicionados:
- `manifest.json`
- `service-worker.js`
- `assets/icons/icon-192.png`
- `assets/icons/icon-512.png`

Para testar localmente, abra a pasta no CMD e rode:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`. No navegador, clique em instalar aplicativo.

Também foi reforçada a função **Limpar estoque**, apagando os itens carregados na tabela por ID, com confirmação dupla.

## V113 - Otimização, responsividade e segurança

Esta versão mantém as funções existentes e adiciona melhorias de performance, responsividade e segurança.

Arquivos principais alterados:
- `index.html`
- `assets/app.css`
- `src/app.js`
- `src/pwa-register.js`
- `service-worker.js`
- `manifest.json`
- `netlify.toml`
- `docs/OTIMIZACAO_SEGURANCA_V113.md`

Principais mudanças:
- Scripts carregam com `defer`.
- Registro do Service Worker foi separado em `src/pwa-register.js`.
- Cache PWA atualizado para `top-planejados-v113-optimized-secure`.
- CSS recebeu ajustes para celular, tabelas e redução de overflow horizontal.
- Ícones e imagens PNG principais foram comprimidos sem alterar dimensões.
- Adicionadas CSP e headers de segurança para Netlify.
- Entradas principais agora têm limpeza básica, limite de tamanho e validação de imagem.
- Endpoint da API de render precisa usar HTTPS.

Observação: a CSP ainda usa `unsafe-inline` porque o app atual tem muitos botões gerados com `onclick`. Remover isso agora quebraria funções existentes. A migração segura futura é trocar esses handlers por eventos delegados.
