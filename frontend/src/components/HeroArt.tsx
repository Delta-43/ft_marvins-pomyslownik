/** Landing hero illustration (DESIGN.md §2): what the service does, in one flat picture.
 *  A lit bulb is the innovation; the figure on the left holds a magnifying glass to it and the glass shows a check
 *  (verification); the figure on the right lifts a token into a row of linked tokens: people, an institution, a
 *  confirmed document (connection).
 *  Drawn flat: solid palette fills, one shade per form, no gradients, no outlines. Decorative, so hidden from
 *  assistive technology. It never moves. */

const C = {
  paper: "#F1F8FD", shade: "#CFE6F8", sky: "#A0D1F8", teal: "#A1E7E1", green: "#6BB437", greenDark: "#40731A", greenLight: "#8FD25C",
  mint: "#C3E8AF", blue: "#0085CC", blueLight: "#3FA9E3", deep: "#006095", navy: "#02314E", navyUp: "#03446A", ink: "#011E30", white: "#FFFFFF",
} as const;

type Look = { skin: string; shirt: string; sleeve: string; pants: string; shoes: string };

/** A standing figure, drawn facing right around its feet: long legs, broad torso, small head. `children` come last, so
 *  whatever the figure holds sits in front of its body; `behind` is drawn first, behind it. */
function Figure({ look, front, back, hair, behind, children }: { look: Look; front: string; back: string; hair: React.ReactNode; behind?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      {behind}
      <path d={back} fill="none" stroke={look.sleeve} strokeWidth="18" strokeLinecap="round" />
      <path d="M-10,-104 L-15,-14 M12,-104 L21,-14" fill="none" stroke={look.pants} strokeWidth="25" strokeLinecap="round" />
      <rect x="-29" y="-15" width="34" height="15" rx="7.5" fill={look.shoes} />
      <rect x="8" y="-15" width="36" height="15" rx="7.5" fill={look.shoes} />
      <path d="M-27,-92 C-38,-136 -37,-178 -23,-198 Q0,-209 23,-198 C38,-178 41,-136 31,-92 Z" fill={look.shirt} />
      <rect x="-3" y="-218" width="12" height="22" rx="5" fill={look.skin} />
      <circle cx="5" cy="-231" r="16" fill={look.skin} />
      {hair}
      {children}
      <path d={front} fill="none" stroke={look.sleeve} strokeWidth="18" strokeLinecap="round" />
    </>
  );
}

function Token({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="27" fill={C.paper} />
      <circle r="27" fill="none" stroke={C.sky} strokeWidth="3" />
      {children}
    </g>
  );
}

function Leaves({ x, s = 1 }: { x: number; s?: number }) {
  const leaf = "M0,0 C-17,-26 -14,-58 0,-76 C14,-58 17,-26 0,0 Z";
  return (
    <g transform={`translate(${x} 400) scale(${s})`}>
      <path d={leaf} fill={C.greenDark} transform="rotate(-32)" />
      <path d={leaf} fill={C.greenLight} transform="rotate(30) scale(0.86)" />
      <path d={leaf} fill={C.green} />
    </g>
  );
}

const RAYS = [-37, -14, 14, 37, 60];

export function HeroArt() {
  const a: Look = { skin: C.teal, shirt: C.green, sleeve: C.greenLight, pants: C.paper, shoes: C.ink };
  const b: Look = { skin: C.sky, shirt: C.blueLight, sleeve: C.blue, pants: C.mint, shoes: C.ink };
  return (
    <svg className="hero-art" viewBox="0 0 640 440" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {/* Backdrop: two fields and a few loose shapes. */}
      <path d="M92,150 C120,40 330,-14 474,28 C624,72 706,192 664,304 C632,388 520,424 380,416 C230,408 58,332 92,150 Z" fill={C.navyUp} />
      <circle cx="338" cy="196" r="136" fill={C.deep} opacity="0.6" />
      <path d="M26,74 q7,-10 14,0 t14,0 t14,0 t14,0" fill="none" stroke={C.green} strokeWidth="4" strokeLinecap="round" />
      <g fill={C.sky} opacity="0.75">
        {[0, 1, 2].map((i) => [0, 1, 2].map((j) => <circle key={`${i}${j}`} cx={24 + i * 12} cy={196 + j * 12} r="2.2" />))}
      </g>
      <path d="M598,236 h18 M607,227 v18" fill="none" stroke={C.teal} strokeWidth="4" strokeLinecap="round" />
      <circle cx="616" cy="326" r="8" fill="none" stroke={C.sky} strokeWidth="4" />
      <path d="M136,36 l12,20 h-24 Z" fill={C.blue} />
      <path d="M22,330 h14 M29,323 v14" fill="none" stroke={C.paper} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />

      {/* Ground and plants. */}
      <rect x="34" y="400" width="572" height="14" rx="7" fill={C.deep} />
      <ellipse cx="124" cy="401" rx="46" ry="5" fill={C.ink} opacity="0.35" />
      <ellipse cx="518" cy="401" rx="46" ry="5" fill={C.ink} opacity="0.35" />
      <ellipse cx="330" cy="401" rx="76" ry="5" fill={C.ink} opacity="0.35" />
      <Leaves x={56} />
      <Leaves x={596} s={0.78} />

      {/* Connection: linked tokens over the scene. */}
      <path d="M330,84 C334,58 384,52 426,56 M478,58 C520,58 556,76 574,100 M330,84 C322,62 284,52 262,50" fill="none" stroke={C.sky} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 10" />
      <Token x={452} y={58}>
        <path d="M-12,-3 L0,-12 L12,-3 Z" fill={C.navy} />
        <path d="M-8.5,0 V9 M0,0 V9 M8.5,0 V9" stroke={C.navy} strokeWidth="4" />
        <rect x="-13" y="10" width="26" height="3.5" rx="1" fill={C.green} />
      </Token>
      <Token x={236} y={48}>
        <rect x="-10" y="-13" width="20" height="26" rx="3" fill={C.navy} />
        <path d="M-5,-6 H5 M-5,-0.5 H2" stroke={C.paper} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="7" cy="9" r="8" fill={C.green} />
        <path d="M3.4,9 L6,11.8 L10.8,6.4" fill="none" stroke={C.white} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </Token>

      {/* Innovation: the bulb, lit, with a small network for a filament. */}
      {RAYS.map((deg, i) => (
        <path key={deg} d="M0,-108 V-128" transform={`translate(330 190) rotate(${deg})`} fill="none" stroke={i % 2 ? C.green : C.paper} strokeWidth="6" strokeLinecap="round" />
      ))}
      <rect x="268" y="374" width="124" height="26" rx="6" fill={C.sky} />
      <rect x="268" y="374" width="124" height="8" rx="4" fill={C.paper} />
      <path d="M306,362 H354 L348,374 H312 Z" fill={C.ink} />
      <rect x="298" y="330" width="64" height="34" rx="6" fill={C.green} />
      <path d="M298,341 H362 M298,352 H362" stroke={C.greenDark} strokeWidth="4" />
      <path d="M238,190 A92,92 0 1 1 422,190 C422,244 372,262 368,318 L292,318 C288,262 238,244 238,190 Z" fill={C.paper} />
      <path d="M330,98 A92,92 0 0 1 422,190 C422,244 372,262 368,318 L346,318 C352,256 392,238 392,190 C392,142 364,108 330,98 Z" fill={C.shade} />
      <rect x="292" y="316" width="76" height="16" rx="4" fill={C.shade} />
      <path d="M318,316 L308,214 M342,316 L352,214" fill="none" stroke={C.deep} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M306,210 L330,168 L354,210 Z" fill="none" stroke={C.green} strokeWidth="4.5" strokeLinejoin="round" />
      <circle cx="306" cy="210" r="10" fill={C.green} /><circle cx="354" cy="210" r="10" fill={C.green} /><circle cx="330" cy="168" r="12" fill={C.blue} />
      <path d="M268,164 A66,66 0 0 1 300,124" fill="none" stroke={C.white} strokeWidth="7" strokeLinecap="round" />

      {/* The figure on the right: presents the bulb and lifts a token into the row. */}
      <g transform="translate(524 400) scale(-1 1)">
        <Figure look={b} front="M25,-186 Q50,-166 70,-154" back="M-23,-188 Q-52,-204 -61,-240"
          hair={<><circle cx="-9" cy="-249" r="8" fill={C.ink} /><path d="M-13,-226 C-17,-252 14,-259 23,-240 C13,-246 -1,-244 -5,-224 Z" fill={C.ink} /></>}>
          <circle cx="-62" cy="-244" r="9.5" fill={b.skin} />
        </Figure>
        <circle cx="72" cy="-153" r="9.5" fill={b.skin} />
      </g>
      <Token x={588} y={122}>
        <circle cx="-7.5" cy="-5" r="5" fill={C.navy} /><circle cx="7.5" cy="-5" r="5" fill={C.green} />
        <path d="M-15.5,11 a8,8 0 0 1 16,0 Z" fill={C.navy} /><path d="M-0.5,11 a8,8 0 0 1 16,0 Z" fill={C.green} />
      </Token>

      {/* The figure on the left: a clipboard in one hand, the magnifying glass in the other. */}
      <g transform="translate(118 400)">
        <Figure look={a} front="M25,-186 Q52,-176 70,-202" back="M-22,-186 Q-50,-160 -36,-128"
          hair={<path d="M-13,-226 C-17,-252 14,-259 23,-240 C13,-246 -1,-244 -5,-224 Z" fill={C.ink} />}>
          <g transform="rotate(-9 -14 -146)">
            <rect x="-34" y="-170" width="38" height="48" rx="4" fill={C.paper} />
            <rect x="-24" y="-175" width="18" height="9" rx="3" fill={C.blue} />
            <path d="M-27,-154 H-3 M-27,-145 H-9" stroke={C.sky} strokeWidth="3" strokeLinecap="round" />
            <path d="M-26,-134 L-21,-129 L-11,-139" fill="none" stroke={C.green} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle cx="-36" cy="-126" r="9.5" fill={a.skin} />
        </Figure>
      </g>

      {/* Verification: the glass, held over the bulb, shows a check. */}
      <path d="M206,178 L184,200" fill="none" stroke={C.ink} strokeWidth="13" strokeLinecap="round" />
      <path d="M206,178 L198,186" fill="none" stroke={C.shade} strokeWidth="13" />
      <circle cx="189" cy="197" r="9.5" fill={a.skin} />
      <circle cx="236" cy="148" r="44" fill={C.navyUp} />
      <circle cx="236" cy="148" r="44" fill={C.sky} opacity="0.3" />
      <circle cx="236" cy="148" r="22" fill={C.green} />
      <path d="M226,148 L233,155.5 L247,140" fill="none" stroke={C.white} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M207,136 A31,31 0 0 1 224,119" fill="none" stroke={C.white} strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
      <circle cx="236" cy="148" r="44" fill="none" stroke={C.paper} strokeWidth="8" />
    </svg>
  );
}
