const characters = [
  {
    id: 'ciclope',
    name: 'Ciclope',
    description: 'Emite poderosas rajadas ópticas, controladas com a ajuda de seu visor.',
  },
  {
    id: 'jean-grey',
    name: 'Jean Grey',
    description:
      'Telepata e telecinética, Jean Grey é uma das mutantes mais poderosas dos X-Men.',
  },
  {
    id: 'lince-negra',
    name: 'Lince Negra',
    description:
      'Atravessa matéria sólida e campos de energia com seu poder de intangibilidade.',
  },
  {
    id: 'tempestade',
    name: 'Tempestade',
    description: 'Controla fenômenos climáticos, incluindo ventos, chuvas e raios.',
  },
  {
    id: 'vampira',
    name: 'Vampira',
    description:
      'Absorve temporariamente memórias, vitalidade e poderes por meio do toque.',
  },
  {
    id: 'wolverine',
    name: 'Wolverine',
    description:
      'Combina fator de cura, sentidos aguçados e garras revestidas de adamantium.',
  },
  {
    id: 'noturno',
    name: 'Noturno',
    description: 'Teletransporta-se e se move com agilidade excepcional.',
  },
  {
    id: 'magneto',
    name: 'Magneto',
    description: 'Manipula metais e campos magnéticos com enorme precisão.',
  },
];
let selected = 0;
const buttons = [...document.querySelectorAll('[data-character]')];

function choose(i, focus = false) {
  selected = (i + characters.length) % characters.length;
  const c = characters[selected];
  buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(n === selected)));
  document.querySelector('#portrait').src = 'assets/images/card-' + c.id + '.png';
  document.querySelector('#portrait').alt = c.name;
  document.querySelector('#character-name').textContent = c.name;
  document.querySelector('#character-desc').textContent = c.description;
  document.querySelector('#number').textContent =
    String(selected + 1).padStart(2, '0') + ' / 08';
  const spot = document.querySelector('.spot');
  spot.classList.remove('changed');
  void spot.offsetWidth;
  spot.classList.add('changed');
  if (focus) buttons[selected].focus();
}
buttons.forEach((b, i) => {
  b.onclick = () => choose(i);
  b.onkeydown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }[e.key];
    if (step) {
      e.preventDefault();
      choose(i + step, true);
    }
  };
});
