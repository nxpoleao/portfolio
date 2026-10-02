# napoleao.dev — Portfólio de Enzo Napoleão

Site estático em HTML, CSS e JavaScript puros: sem frameworks, sem dependências e sem build.

## Estrutura

```
portfolio/
├── index.html
├── css/style.css          # tokens (tema escuro/claro), layout e componentes
├── css/fx.css             # camada extra de animações (tudo sob a classe .fx)
├── css/bit.css            # mascote Bit
├── js/script.js           # tema, menu, scrollspy, reveal, "Executar", copiar e-mail
├── js/fx.js               # animações: malha do hero, textos, diagramas, stack
├── js/bit.js              # mascote Bit: olhar, falas, tour, arrastar
└── assets/
    ├── icons/
    │   ├── logo-mark.png         # monograma N<> original (alta resolução)
    │   ├── logo-mark-sm.png      # versão usada no header/rodapé
    │   ├── favicon.png           # 256px
    │   ├── favicon-48.png
    │   └── apple-touch-icon.png
    └── images/
        ├── cofrinho-app.jpg      # print real do Cofrinho, recortado e comprimido
        └── og-image.png          # imagem de compartilhamento (1200×630)
```

Arquivos antigos que **não são mais usados** pela página: `cofrinho-mockup.png`,
`brysa-mockup.svg`, `rapanui-mockup.svg` e `atlas-mockup.svg`. Podem ser apagados.

## Direção visual

- **Tema:** grafite azulado (não é preto puro) com um único acento azul, herdado do monograma N<>.
  O tema claro continua disponível pelo botão no header, e a escolha fica salva no `localStorage`.
- **Tipografia:** Geist para o texto e Geist Mono para o que é "dado": caminhos, índices e stack.
- **Motivo gráfico:** marcadores quadrados e linhas finas. O mesmo nó aparece no hero, na trajetória e
  nos diagramas de arquitetura dos cases.
- **Seções como caminhos:** `~/sobre`, `~/trajetoria`, `~/cases`, `~/stack`, `~/contato`. O header mostra
  o caminho da seção visível.

Todas as cores estão no bloco `:root` de `css/style.css`, e o tema claro fica em `:root[data-theme="light"]`.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Editar conteúdo

Procure por `EDITAR:` no `index.html`. Há comentários nos pontos onde falta informação real:

| Onde | O que falta |
|---|---|
| Case ATLAS | Banco de dados, deploy e integrações, se puderem ser divulgados |
| Case BRYSA | Link, caso o repositório ou a loja fiquem públicos (hoje `github.com/nxpoleao/brysa` retorna 404) |
| Case Rapanui Natural | Stack e link do site |

O código do painel do hero (`enzo.py`) é Python válido, e a saída do botão **Executar** é o `repr` real
da dataclass. Se alterar o código, atualize a constante `REPR` em `js/script.js`.

## Deploy

É um site 100% estático: basta apontar a Vercel, Netlify, GitHub Pages ou Cloudflare Pages para a raiz.
A URL canônica e a `og:image` apontam para `https://naapoleaodev.vercel.app/`. Ajuste-as se o domínio mudar.
