// Little Keeper's look (V7.8): a plush, felt-textured little animal peeking
// over the edge of the notebook — big glossy eyes, soft fuzzy edges (SVG
// turbulence), head and paws resting on the edge, a pencil in one paw.
// The cat is a grey shorthair in a knitted lemon hat; the bunny wears a
// daisy crown. Growth stages add small keepsakes (a flower, then a gold
// star pin). Parts are separate groups so CSS can breathe, blink, twitch
// the ears, tilt the head and wiggle the pencil. Original artwork.

const LOOK = {
  cat: {
    fur: ["#D9D6D8", "#A9A5AA", "#77737A"],
    inner: "#F2B7BE",
    iris: ["#FFE9A3", "#F2B630", "#C98A12"],
    nose: "#E7939D",
    paw: ["#D3D0D2", "#9C989E"],
  },
  bunny: {
    fur: ["#FFFFFF", "#F4EBE2", "#D8C8B9"],
    inner: "#F6C5CD",
    iris: ["#C79A72", "#8A5A3A", "#4E2E1B"],
    nose: "#EC9AA8",
    paw: ["#FFFDFA", "#E3D4C6"],
  },
};
let uid = 0;
export function keeperSVG({ animal = "bunny", stage = 0, mood = "idle", label = "" } = {}) {
  const look = LOOK[animal] || LOOK.bunny;
  const id = `k${++uid}`;
  const eye = (cx) =>
    mood === "quiet"
      ? `<path d="M${cx - 8} 66 q8 6 16 0" stroke="#3A2E2A" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      : mood === "happy"
        ? `<path d="M${cx - 8} 68 q8 -9 16 0" stroke="#3A2E2A" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
        : `<circle cx="${cx}" cy="64" r="10.5" fill="#2B211E"/><circle cx="${cx}" cy="64" r="9" fill="url(#${id}i)"/><circle cx="${cx}" cy="64.6" r="6.4" fill="#1B1412"/><circle cx="${cx - 3}" cy="60.6" r="3" fill="#fff"/><circle cx="${cx + 3.2}" cy="67.6" r="1.4" fill="#fff" opacity=".85"/><path d="M${cx - 6} 70 a7 7 0 0 0 11 -1" stroke="#fff" stroke-width=".8" fill="none" opacity=".35"/>`;
  const mouth =
    mood === "happy"
      ? `<path d="M55 79 q5 6 10 0 z" fill="#B65A63"/>`
      : animal === "cat"
        ? `<ellipse cx="60" cy="80.5" rx="2.6" ry="3" fill="#B65A63"/>`
        : `<path d="M55.5 78 q2.2 2.6 4.5 0 q2.3 2.6 4.5 0" stroke="#5A3B33" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  const ears =
    animal === "cat"
      ? `<g class="k-ears" filter="url(#${id}fz)"><g class="k-ear-l"><path d="M24 44 L28 14 Q30 10 34 13 L52 32 Z" fill="url(#${id}f)"/><path d="M29 38 L31 20 L45 32 Z" fill="${look.inner}"/></g><g class="k-ear-r"><path d="M96 44 L92 14 Q90 10 86 13 L68 32 Z" fill="url(#${id}f)"/><path d="M91 38 L89 20 L75 32 Z" fill="${look.inner}"/></g></g>`
      : `<g class="k-ears" filter="url(#${id}fz)"><g class="k-ear-l"><ellipse cx="44" cy="18" rx="9.5" ry="24" transform="rotate(-12 44 18)" fill="url(#${id}f)"/><ellipse cx="44" cy="20" rx="4.6" ry="16" transform="rotate(-12 44 20)" fill="${look.inner}"/></g><g class="k-ear-r"><ellipse cx="76" cy="18" rx="9.5" ry="24" transform="rotate(14 76 18)" fill="url(#${id}f)"/><ellipse cx="76" cy="20" rx="4.6" ry="16" transform="rotate(14 76 20)" fill="${look.inner}"/></g></g>`;
  // The cat's knitted lemon hat (with a leaf); the bunny's daisy crown.
  const hat =
    animal === "cat"
      ? `<g class="k-hat"><path d="M22 52 Q20 18 60 14 Q100 18 98 52 Q60 40 22 52Z" fill="url(#${id}h)"/><path d="M22 52 Q20 18 60 14 Q100 18 98 52 Q60 40 22 52Z" fill="url(#${id}knit)" opacity=".5"/><path d="M21 51 Q60 37 99 51 L99 57 Q60 44 21 57Z" fill="#EDBE32"/><path d="M21 51 Q60 37 99 51 L99 57 Q60 44 21 57Z" fill="url(#${id}rib)" opacity=".55"/><circle cx="84" cy="34" r="8.5" fill="#FFF3B8" stroke="#F2C94C" stroke-width="2"/><path d="M84 26v16M76 34h16M78.5 28.5l11 11M89.5 28.5l-11 11" stroke="#F2C94C" stroke-width="1.2"/><path d="M60 15 q-1-6 2-9" stroke="#6F8F4E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M62 8 q14-10 22 2 q-12 7-22-2Z" fill="url(#${id}leaf)"/><path d="M63 8 q9 0 17 2" stroke="#5E7F42" stroke-width=".8" fill="none"/>${stage >= 1 ? `<g class="k-flower"><circle cx="38" cy="30" r="3.4" fill="#fff"/><circle cx="33.5" cy="31" r="3" fill="#fff"/><circle cx="36" cy="26" r="3" fill="#fff"/><circle cx="40.5" cy="26.5" r="3" fill="#fff"/><circle cx="37" cy="29" r="2" fill="#F2B630"/></g>` : ""}${stage >= 2 ? `<path class="k-star" d="M52 30 l2.4 4.8 5.3 .8 -3.9 3.7 .9 5.3 -4.7-2.5 -4.7 2.5 .9-5.3 -3.9-3.7 5.3-.8z" fill="#F5CF5A" stroke="#D9A82C" stroke-width="1"/>` : ""}</g>`
      : `<g class="k-hat">${[[38, 30], [50, 23], [62, 21], [74, 24], [84, 31]].map(([x, y], i) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="2.4" ry="4" transform="rotate(${a})" fill="${i % 2 ? "#FFFFFF" : "#FDF1F4"}"/>`).join("")}<circle r="2.2" fill="#F2C94C"/></g>`).join("")}<path d="M34 34 q26 -16 54 0" stroke="#8FB57E" stroke-width="2" fill="none"/>${stage >= 1 ? `<path d="M44 26 q-6-8 2-10 q2 6-2 10Z" fill="#A9C79A"/>` : ""}${stage >= 2 ? `<path class="k-star" d="M60 10 l2.4 4.8 5.3 .8 -3.9 3.7 .9 5.3 -4.7-2.5 -4.7 2.5 .9-5.3 -3.9-3.7 5.3-.8z" fill="#F5CF5A" stroke="#D9A82C" stroke-width="1"/>` : ""}</g>`;
  const whiskers =
    animal === "cat" ? `<path d="M30 76h-14M30 80l-13 4M90 76h14M90 80l13 4" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>` : "";
  return `<svg class="keeper-svg ${animal} mood-${mood}" viewBox="0 0 120 112" role="img" aria-label="${label}"><defs>
<radialGradient id="${id}f" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="${look.fur[0]}"/><stop offset=".55" stop-color="${look.fur[1]}"/><stop offset="1" stop-color="${look.fur[2]}"/></radialGradient>
<radialGradient id="${id}p" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="${look.paw[0]}"/><stop offset="1" stop-color="${look.paw[1]}"/></radialGradient>
<radialGradient id="${id}i" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="${look.iris[0]}"/><stop offset=".55" stop-color="${look.iris[1]}"/><stop offset="1" stop-color="${look.iris[2]}"/></radialGradient>
<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE987"/><stop offset="1" stop-color="#F3C83C"/></linearGradient>
<linearGradient id="${id}leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9CC27A"/><stop offset="1" stop-color="#5E8A44"/></linearGradient>
<pattern id="${id}knit" width="5" height="6" patternUnits="userSpaceOnUse"><path d="M0 0 l2.5 3 2.5 -3 M0 3 l2.5 3 2.5 -3" stroke="#D9A82C" stroke-width=".7" fill="none"/></pattern>
<pattern id="${id}rib" width="3" height="8" patternUnits="userSpaceOnUse"><rect width="1.2" height="8" fill="#D39D1E"/></pattern>
<filter id="${id}fz" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5"/></filter>
<filter id="${id}felt" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="7" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 0" result="w"/><feComposite in="w" in2="SourceGraphic" operator="in" result="tex"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="tex"/></feMerge></filter>
<filter id="${id}s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>
<g class="k-body">
<g class="k-head">${ears}
<g filter="url(#${id}felt)"><g filter="url(#${id}fz)"><ellipse cx="60" cy="66" rx="41" ry="36" fill="url(#${id}f)"/></g></g>
<ellipse cx="44" cy="46" rx="12" ry="6" transform="rotate(-16 44 46)" fill="#fff" opacity=".28"/>
${mood === "quiet" || mood === "happy" ? eye(43) + eye(77) : `<g class="k-eyes">${eye(43)}${eye(77)}</g>`}
<ellipse cx="33" cy="80" rx="7" ry="4" fill="#F4A9B4" opacity=".55" filter="url(#${id}s)"/><ellipse cx="87" cy="80" rx="7" ry="4" fill="#F4A9B4" opacity=".55" filter="url(#${id}s)"/>
<path d="M57 74.5 h6 l-3 3.4z" fill="${look.nose}" stroke="${look.nose}" stroke-width="1.6" stroke-linejoin="round"/>
${mouth}${whiskers}${hat}
</g>
<ellipse class="k-pawshadow" cx="40" cy="108" rx="13" ry="3" fill="#3C2D1E" opacity=".16" filter="url(#${id}s)"/><ellipse class="k-pawshadow" cx="80" cy="108" rx="13" ry="3" fill="#3C2D1E" opacity=".16" filter="url(#${id}s)"/>
<g class="k-pencil"><rect x="86" y="74" width="5.4" height="30" rx="2.2" transform="rotate(24 88 89)" fill="#F2CD5C"/><rect x="86" y="70" width="5.4" height="5.5" rx="1.6" transform="rotate(24 88 89)" fill="#F1A7B5"/></g>
<g class="k-paws" filter="url(#${id}felt)"><ellipse cx="40" cy="102" rx="13" ry="9.5" fill="url(#${id}p)"/><ellipse cx="80" cy="102" rx="13" ry="9.5" fill="url(#${id}p)"/><path d="M36 106 v-4M41 106.5 v-4.5M46 106 v-4M76 106 v-4M81 106.5 v-4.5M86 106 v-4" stroke="${look.fur[2]}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/></g>
</g>
</svg>`;
}
