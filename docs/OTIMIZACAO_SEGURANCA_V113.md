# Top Planejados V113 - Otimização, responsividade e segurança

Alterações aplicadas sem remover funcionalidades existentes.

## Performance e PWA
- Scripts `src/config.js`, `src/app.js` e `src/pwa-register.js` carregam com `defer`.
- Registro do Service Worker saiu do HTML inline e foi para `src/pwa-register.js`.
- Service Worker atualizado para cache versionado `top-planejados-v113-optimized-secure`.
- Estratégia `cacheFirst` para assets estáticos e `networkFirst` para HTML/navegação.
- Requests externos e Supabase não são interceptados pelo cache do PWA.
- CSS recebeu ajustes para rolagem suave em tabelas, menos overflow e melhor uso em mobile.

## Responsividade
- Correções para telas até 900px e 520px.
- Sidebar vira bloco superior no mobile.
- Topbar e ações ficam em grid no celular.
- Tabelas preservam rolagem horizontal interna sem quebrar a tela inteira.
- Cards, formulários, imagens e prévias agora têm limites melhores.

## Segurança
- Adicionada CSP inicial no `index.html` e headers no `netlify.toml`.
- Adicionados headers: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `X-Frame-Options`.
- `rawFetch` bloqueia URL insegura que não seja HTTPS.
- Endpoint da API de render agora precisa ser HTTPS válido.
- Inputs principais passam por limpeza de caracteres de controle e limite de tamanho.
- Telefones passam por normalização básica.
- Imagens importadas são validadas, redimensionadas e comprimidas antes de salvar em base64.
- Prévia de imagens aceita somente `data:image`, `blob:`, `https://` ou assets locais.
- Links com `target="_blank"` recebem `rel="noopener noreferrer"`.

## Observação técnica
A CSP ainda mantém `script-src 'unsafe-inline'` porque o app atual gera muitos botões com `onclick` e alguns documentos de impressão com script inline. Remover isso agora quebraria funções existentes. O caminho correto no futuro é migrar esses handlers inline para eventos delegados.
