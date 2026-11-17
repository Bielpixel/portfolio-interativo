# Biel · Portfólio interativo

Portfólio de Bielpixel construído em tempo real por cursores animados. Feito com HTML, CSS e JavaScript, com oito experiências que abrem dentro do próprio site.

**[Abrir o portfólio](https://bielpixel.github.io/portfolio-interativo/)**

## Projetos

- **ADAproject** — demonstração de proteção animal e adoção.
- **X-Men** — seleção interativa de personagens.
- **Flappy Bird** — jogo com placar, recorde e pausa.
- **Portfólio clássico** — apresentação pessoal.
- **Primeiros passos** — releitura do primeiro estudo de landing page.
- **Cards / Lab** — componentes e estados de interface.
- **AppIC** — plano de estudos com progresso salvo no navegador.
- **Neon Pong** — Aurora contra Kage, com barreiras e habilidades especiais.

O site também apresenta links para Yamato Inplant e SondMix.

## Como abrir

Extraia o ZIP inteiro e abra `index.html` no navegador com um duplo clique. Mantenha as pastas `assets` e `projects` ao lado dele.

O portfólio e os oito projetos rodam localmente, sem servidor, login, ChatGPT ou conexão com a internet. Imagens, sons e fontes estão incluídos. Apenas os links externos para GitHub e CurseForge precisam de internet.

Não há instalação nem etapa de compilação. O botão **Rever animação** repete a construção do portfólio. Cada projeto oferece uma forma de voltar à galeria e um link para seu repositório original.

## Estrutura

```text
portfolio-interativo/
├── index.html
├── cursor_party_reel.html
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── animation.css
│   │   ├── portal.css
│   │   ├── no-script.css
│   │   └── project-common.css
│   ├── js/
│   │   ├── animation.js
│   │   ├── projects.js
│   │   ├── portal.js
│   │   └── project-bridge.js
│   └── images/
│       └── noise.svg
├── projects/
│   ├── ada/
│   ├── appic/
│   ├── cards/
│   ├── classic/
│   ├── flappy/
│   ├── landing/
│   ├── pong/
│   └── xmen/
└── docs/
    └── LEIA-ME.txt
```

Cada projeto tem seu `index.html` e uma pasta `assets` com os estilos, scripts e recursos que utiliza (`css`, `js`, `images`, `audio` ou `fonts`). Projetos sem lógica própria reutilizam apenas o script de navegação compartilhado.

O HTML referencia o CSS com `<link rel="stylesheet">` e o JavaScript com `<script src="...">`. Os estilos estáticos ficam nos arquivos CSS; os scripts continuam controlando os estilos dinâmicos usados nas animações e nos jogos.

## Editar o código

- **Conteúdo e estrutura:** `index.html` e `projects/<projeto>/index.html`.
- **Visual do portfólio:** `assets/css/base.css` e `assets/css/portal.css`.
- **Animação dos cursores:** `assets/js/animation.js` e `assets/css/animation.css`.
- **Dados dos projetos:** `assets/js/projects.js`.
- **Abertura e retorno dos projetos:** `assets/js/portal.js` e `assets/js/project-bridge.js`.
- **Visual e comportamento de cada experiência:** sua pasta `assets`.

`cursor_party_reel.html` é uma entrada alternativa com o mesmo conteúdo do `index.html`; mantenha os dois sincronizados ao alterar o HTML principal. Ambos usam os mesmos arquivos CSS e JavaScript.

Os arquivos usam dois espaços para indentação, blocos separados e propriedades CSS em linhas individuais. `.editorconfig` e `.prettierrc.json` registram esse padrão. Quem tiver Node.js instalado pode formatar mudanças com:

```sh
npx prettier@3.6.2 --write "**/*.{html,css,js,json,md,svg}"
```

Esse comando é opcional para desenvolvimento; não é necessário para abrir o site.

## Créditos e observações

Projetos de [Bielpixel](https://github.com/Bielpixel). As experiências revisadas preservam referências aos repositórios originais. X-Men é um estudo do curso Dev em Dobro; as artes pertencem aos respectivos titulares. Flappy Bird é baseado no estudo de DevSoutinho e inclui sua licença na pasta do projeto.

ADA é uma demonstração local, sem envio de formulários, pagamentos ou banco de dados. AppIC armazena a lista neste navegador. As licenças das fontes Space Grotesk e Space Mono estão em `projects/pong/assets/fonts`.
