# Passo a passo: Supabase + usuários

## 1. Criar projeto

Crie um projeto no Supabase e aguarde o banco ficar pronto.

## 2. Rodar o banco

Abra `supabase/schema.sql`, copie tudo e rode no SQL Editor do Supabase.

O SQL cria:

- `profiles`: controle dos usuários.
- `tab_settings`: controle das abas.
- `company_settings`: dados da empresa para contrato.
- `render_settings`: preparação da API futura.
- `clients`: clientes.
- `projects`: projetos.
- `services`: serviços.
- `transactions`: entradas e saídas.
- `security_logs`: logs básicos.

Também ativa RLS para proteger o banco.

## 3. Desativar confirmação de e-mail, se quiser login mais simples

No Supabase:

Authentication > Providers > Email > Confirm email.

Para uso interno da empresa, desativar confirmação deixa mais simples. Se deixar ativado, o usuário precisa confirmar o e-mail.

## 4. Configurar `src/config.js`

Use somente a chave pública:

```js
window.TOP_CONFIG = {
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY: "sua-chave-publica"
};
```

## 5. Criar primeiro admin

Crie sua conta pelo app e rode:

```sql
update public.profiles
set role = 'admin', active = true
where email = 'seu-email@email.com';
```

## 6. Liberar usuários

Depois disso, o admin faz tudo pela aba Admin.
