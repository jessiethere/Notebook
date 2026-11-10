// Little Keeper's look (V7.7): a soft, clay-like 2.5D character drawn in SVG
// — light from the top left, a gloss highlight, blush, a soft contact shadow —
// holding a pencil and a little notebook. Parts are separate groups so CSS
// can breathe, blink, twitch the ears, tilt the head and wiggle the pencil.
// Growth stages add small keepsakes (a sprout, then a scarf and a badge).
// Original artwork for Little Days (no external assets).

const PALETTE = {
  bunny: { fur: ["#FFFDF8", "#F3E8DD", "#D9C7B8"], ear: "#F6C9CF", nose: "#E89AA6", eye: "#3B302B" },
  cat: { fur: ["#FFE3C2", "#F5B97F", "#D98E55"], ear: "#F7C5B5", nose: "#D9786B", eye: "#3B302B" },
};
let uid = 0;
export function keeperSVG({ animal = "bunny", stage = 0, mood = "idle", label = "" } = {}) {
  const p = PALETTE[animal] || PALETTE.bunny;
  const id = `k${++uid}`;
  const eyes =
    mood === "quiet"
      ? `<path d="M47 57q4 3 8 0M65 57q4 3 8 0" stroke="${p.eye}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      : mood === "happy"
        ? `<path d="M47 58q4-5 8 0M65 58q4-5 8 0" stroke="${p.eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        : `<g class="k-eyes"><ellipse cx="51" cy="57" rx="3.6" ry="4.4" fill="${p.eye}"/><ellipse cx="69" cy="57" rx="3.6" ry="4.4" fill="${p.eye}"/><circle cx="52.3" cy="55.4" r="1.3" fill="#fff"/><circle cx="70.3" cy="55.4" r="1.3" fill="#fff"/></g>`;
  const ears =
    animal === "cat"
      ? `<g class="k-ears"><path class="k-ear-l" d="M36 44 L40 20 Q42 17 45 20 L55 36 Z" fill="url(#${id}f)"/><path d="M40 39 L42 25 L50 35 Z" fill="${p.ear}" opacity=".85"/><path class="k-ear-r" d="M84 44 L80 20 Q78 17 75 20 L65 36 Z" fill="url(#${id}f)"/><path d="M80 39 L78 25 L70 35 Z" fill="${p.ear}" opacity=".85"/></g>`
      : `<g class="k-ears"><g class="k-ear-l"><ellipse cx="47" cy="22" rx="7.5" ry="21" transform="rotate(-10 47 22)" fill="url(#${id}f)"/><ellipse cx="47" cy="24" rx="3.6" ry="14" transform="rotate(-10 47 24)" fill="${p.ear}"/></g><g class="k-ear-r"><ellipse cx="73" cy="22" rx="7.5" ry="21" transform="rotate(12 73 22)" fill="url(#${id}f)"/><ellipse cx="73" cy="24" rx="3.6" ry="14" transform="rotate(12 73 24)" fill="${p.ear}"/></g></g>`;
  const whiskers = animal === "cat" ? `<path d="M38 64h-8M38 67l-7 2M82 64h8M82 67l7 2" stroke="#B98A6A" stroke-width="1" stroke-linecap="round" opacity=".7"/>` : "";
  // Keepsakes of growth: a sprout (stage 1), then a scarf and a little badge (stage 2).
  const sprout = stage >= 1 ? `<g class="k-sprout"><path d="M60 30 q0-8 0-10" stroke="#7D9A6A" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M60 22 q-8-6-10 1 q7 2 10-1Z" fill="#A9C79A"/><path d="M60 21 q8-7 11 0 q-7 3-11 0Z" fill="#8FB57E"/></g>` : "";
  const scarf = stage >= 2 ? `<path d="M40 78 q20 9 40 0 l0 6 q-20 9-40 0z" fill="#C9D7C1"/><path d="M68 82 l5 12 l-7-1 z" fill="#B3C7A8"/><circle cx="46" cy="96" r="4" fill="#E7C66A" stroke="#C9A64A" stroke-width="1"/>` : "";
  return `<svg class="keeper-svg ${animal} mood-${mood}" viewBox="0 0 120 120" role="img" aria-label="${label}"><defs>
<radialGradient id="${id}f" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${p.fur[0]}"/><stop offset=".55" stop-color="${p.fur[1]}"/><stop offset="1" stop-color="${p.fur[2]}"/></radialGradient>
<radialGradient id="${id}b" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="${p.fur[0]}"/><stop offset=".6" stop-color="${p.fur[1]}"/><stop offset="1" stop-color="${p.fur[2]}"/></radialGradient>
<linearGradient id="${id}n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9D0B0"/><stop offset="1" stop-color="#86A47A"/></linearGradient>
<filter id="${id}s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
</defs>
<ellipse class="k-shadow" cx="60" cy="112" rx="30" ry="5" fill="#3C2D1E" opacity=".16" filter="url(#${id}s)"/>
<g class="k-body">
<ellipse cx="60" cy="88" rx="27" ry="24" fill="url(#${id}b)"/>
<ellipse cx="50" cy="78" rx="10" ry="6" fill="#fff" opacity=".35"/>
${scarf}
<g class="k-head">${ears}${sprout}
<circle cx="60" cy="58" r="25" fill="url(#${id}f)"/>
<ellipse cx="48" cy="42" rx="7" ry="3.6" transform="rotate(-18 48 42)" fill="#fff" opacity=".32"/>
${eyes}
<ellipse cx="45" cy="65" rx="5" ry="3" fill="#F4A9B4" opacity=".55" filter="url(#${id}s)"/><ellipse cx="75" cy="65" rx="5" ry="3" fill="#F4A9B4" opacity=".55" filter="url(#${id}s)"/>
<ellipse cx="60" cy="63" rx="2.6" ry="2" fill="${p.nose}"/>
<path d="M56.5 66.5q3.5 3 3.5 0q0 3 3.5 0" stroke="${p.eye}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
${whiskers}
</g>
<g class="k-book"><rect x="44" y="84" width="32" height="22" rx="3" fill="url(#${id}n)"/><rect x="44" y="84" width="4" height="22" rx="1.5" fill="#6F8C62"/><rect x="51" y="89" width="20" height="2" rx="1" fill="#fff" opacity=".7"/><rect x="51" y="94" width="14" height="2" rx="1" fill="#fff" opacity=".55"/></g>
<ellipse cx="45" cy="93" rx="6" ry="5" fill="url(#${id}b)"/>
<g class="k-pencil"><rect x="72" y="70" width="5" height="26" rx="2" transform="rotate(28 74 83)" fill="#F2CD5C"/><rect x="72" y="66" width="5" height="5" rx="1.5" transform="rotate(28 74 83)" fill="#F1A7B5"/><path d="M80.5 95.5 l4.5 5.5 l1-6.5z" fill="#E9D3B0"/></g>
<ellipse cx="78" cy="88" rx="6" ry="5" fill="url(#${id}b)"/>
</g>
</svg>`;
}
