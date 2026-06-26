# Render API futura / MyArchitectAI

A aba de renderização está preparada para usar uma API externa, mas sem salvar chave secreta no navegador.

## Como vai funcionar

1. O usuário envia a imagem do projeto.
2. O app gera um prompt técnico fiel ao projeto.
3. O app envia imagem + prompt para um endpoint/proxy.
4. O endpoint/proxy chama a API do MyArchitectAI ou outra API.
5. O app recebe a imagem final.

## Por que precisa de proxy?

Porque o `src/config.js` é público para quem abre o navegador. Nunca coloque chave paga ou service_role nele.

## Payload enviado pelo app

```json
{
  "image": "data:image/png;base64,...",
  "file_name": "projeto.png",
  "prompt": "Transforme a imagem enviada...",
  "provider": "myarchitectai-proxy",
  "plan": "inicial",
  "source": "top-planejados-v65"
}
```

## Planos

- Plano Inicial: 10 renders por dia.
- Plano Melhor: 50 renders por dia.

O usuário solicita o plano na aba Render API. O administrador ativa na aba Admin.
