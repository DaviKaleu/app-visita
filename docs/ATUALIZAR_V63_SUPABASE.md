# Atualizar para V63

1. Faça backup da pasta que você usa hoje.
2. Extraia a pasta `top-planejados-v63-online`.
3. Copie seu arquivo antigo `src/config.js` para a pasta nova `src/config.js`.
4. No Supabase, abra **SQL Editor**.
5. Rode o arquivo `supabase/migration_v63.sql`.
6. Abra o app novo e pressione `Ctrl + F5`.

A V63 não muda a chave do Supabase e não apaga seus dados.

## O que a migration faz

- Mantém todas as tabelas da V62.
- Atualiza descrições das abas.
- Garante a aba Projetista 3D ativa.

## Atenção

Não coloque chave do MyArchitectAI no `src/config.js`. A renderização deve continuar preparada para endpoint/proxy seguro.
