# Top Visita Técnica - v6 corrigida

Correções desta versão:

- Corrigido erro que impedia adicionar objetos e linhas de medida quando alguns botões não carregavam corretamente.
- Corrigida visualização da foto no celular com botão **Ajustar foto**.
- A barra de ferramentas ficou mais compacta no celular para a foto não sumir da tela.
- O modo **Visualizar medidas** mostra as setas sem abrir edição.
- O botão **Mover / editar** volta a permitir editar e arrastar objetos.
- Corrigido salvamento de clientes usando banco interno do navegador, além do armazenamento antigo.
- Fotos são comprimidas para evitar estourar a memória do navegador.
- Mantido Exportar/Importar projeto em JSON.

## Como usar no GitHub Pages

Envie estes arquivos na branch `main`, por cima dos antigos:

- index.html
- styles.css
- app.js
- sw.js
- manifest.webmanifest
- README.md

Depois abra no celular com:

```text
https://davikaleu.github.io/app-visita/?v=9
```

Se ainda aparecer a versão antiga, remova o app da tela inicial e adicione novamente.
