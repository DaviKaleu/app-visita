# Top Visita Técnica

Aplicativo PWA para visitas técnicas de móveis planejados.

## O que essa versão faz

- Cadastro de clientes
- Cadastro de ambientes/projetos por cliente
- Edição e exclusão de clientes/ambientes
- Foto do ambiente usando câmera ou galeria
- Modo croqui branco com contorno da foto
- Marcação de tomadas, interruptores, portas, janelas, colunas, rodapés, bancada, cuba e outros obstáculos
- Edição das marcações com altura, distância e observação
- Modo visualização: ao clicar em uma marcação aparecem as setas e medidas sem abrir a aba de edição
- Setas automáticas ao selecionar uma marcação, mostrando distância da parede esquerda, parede direita e altura do chão
- Calibração usando uma medida conhecida
- Linhas de medida
- Aba de anotações de medidas dentro do editor do ambiente
- Exportação e importação de projeto em JSON, mantendo foto, marcações, medidas, escala e anotações
- Salvar/baixar imagem PNG marcada
- Compartilhar imagem pelo celular quando o navegador permitir
- Funciona offline depois de abrir a primeira vez

## Como usar no computador

Abra o arquivo `index.html` no navegador.

Para testar como app instalável, rode um servidor local na pasta:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Como colocar no celular

1. Hospede a pasta em um site HTTPS, por exemplo GitHub Pages, Netlify ou Vercel.
2. Abra o link no navegador do celular.
3. No Chrome Android, toque em “Adicionar à tela inicial” ou no botão “Instalar”, se aparecer.

## Observação importante

A foto sozinha não dá medida 100% real. Para aproximar a escala, use o botão “Calibrar medida” e marque uma distância conhecida, como largura de parede, altura da porta ou medida de uma bancada. Sem calibrar, as setas aparecem em pixels; depois de calibrar, aparecem em cm/m.

## Próximos upgrades recomendados

- Login com usuários autorizados
- Backup em nuvem com Firebase ou Supabase
- Geração de PDF da visita técnica
- Sincronização entre celular e computador
- Biblioteca de objetos com medidas padrão
- Assinatura do cliente na visita
