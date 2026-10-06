const COLORS={neutral:['#ad8bdf','#e2d1fa'],water:['#5abbe0','#c2f0fc'],earth:['#96aa79','#d5c899'],fire:['#e79c56','#ffe5aa'],wind:['#9bcdbb','#e4fff4'],lightning:['#c9adf3','#faf0b7']};
const PATHS={
 neutral:'M10 2 13 7 17 10 13 13 10 18 7 13 3 10 7 7Z',
 water:'M2 17 6 9 17 2 12 13Z',
 earth:'M3 17 4 12 6 9 8 17 7 11 10 2 14 17 15 10 17 13 18 17Z',
 fire:'M11 2 12 7 15 5 17 11 15 16 10 18 5 16 3 11 7 6 7 11Z',
 wind:'M7 1 12 4 16 9 16 12 12 17 7 19 10 14 11 10 10 6Z',
 lightning:'M11 2H16L11 8H16L6 18 8 11H4Z'
};
export function abilityIcon(element,key) {
  const [base,light]=COLORS[element]||COLORS.neutral;
  const path=PATHS[element]||PATHS.neutral;
  const second={fire:'M9 1H12L11 5 15 3 18 9 17 15 13 18H7L3 14 3 9 7 4 7 10 10 8Z',earth:'M2 17 4 7 9 2 8 12ZM9 17 12 3 15 8 13 16ZM15 17 17 8 19 4 19 16Z',water:'M1 16 4 10 6 7 10 4 15 3 19 5 17 9 13 8 11 10 15 13 19 16V18H1Z',wind:'M2 3H18V5H2ZM4 7H16V9H4ZM6 11H14V13H6ZM8 15H12V18H8Z',lightning:'M1 14 5 9 9 11 12 6 10 3 15 2 18 5 17 8 20 10 15 11 12 15 8 14 5 17Z'};
  const art=key===1?`<path d="${path}" fill="${base}"/><path d="M8 8H10V12H8Z" fill="${light}"/>`
    :key===2?`<path d="${second[element]||PATHS.neutral}" fill="${base}"/><path d="M9 8H11V10H9Z" fill="${light}"/>`
    :`<path d="M9 1H11V5H9ZM9 15H11V19H9ZM1 9H5V11H1ZM15 9H19V11H15ZM3 3H6V6H3ZM14 3H17V6H14ZM3 14H6V17H3ZM14 14H17V17H14Z" fill="${base}"/><path d="M8 5H12V8H15V12H12V15H8V12H5V8H8Z" fill="${light}"/>`;
  return `<svg viewBox="0 0 20 20" aria-hidden="true" shape-rendering="crispEdges">${art}</svg>`;
}
