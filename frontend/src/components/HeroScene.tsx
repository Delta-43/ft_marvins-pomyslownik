/** Landing hero: the animated scene above the four panels (DESIGN.md §7). One SVG, four acts, one per panel:
 *  1 a rocket launches and flies off; 2 it loops around a star, the star rounds into a circle and the circle becomes
 *  a magnifying glass; 3 the glass finds the institutions, which grow out of it; 4 the view pushes into a window of the
 *  institute, two people shake hands, and a firework puts the rocket back on the pad. Every act is a set of 6 s CSS
 *  animations picked by `data-scene` (hero-scene.css), so the picture and the panel text change together and each act
 *  ends where the next begins.
 *  Drawn flat: solid fills from the palette, one shade per form, no gradients or outlines.
 *  Decorative: hidden from assistive technology. Every shape is drawn around its own origin and placed from CSS. */

const C = {
  paper: "#F1F8FD", shade: "#CFE6F8", sky: "#A0D1F8", teal: "#A1E7E1", green: "#6BB437", greenDark: "#40731A", greenLight: "#8FD25C",
  mint: "#C3E8AF", mintLight: "#DDF3D0", blue: "#0085CC", blueLight: "#3FA9E3", deep: "#006095", navy: "#02314E", navyUp: "#03446A", white: "#FFFFFF",
} as const;

const WIN_X = [-36, -10, 16];
const WIN_Y = [-108, -82, -56];
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);
const SPIKES = [0, 72, 144, 216, 288];
const css = (v: Record<string, string>) => v as React.CSSProperties;

function Burst({ className, r = 1 }: { className: string; r?: number }) {
  return (
    <g className={`a hs-burst ${className}`}>
      <g transform={`scale(${r})`}>
        {RAYS.map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <line x1="0" y1={deg % 60 ? -14 : -18} x2="0" y2={deg % 60 ? -28 : -38} />
            <circle cx="0" cy={deg % 60 ? -36 : -47} r={deg % 60 ? 2 : 3} />
          </g>
        ))}
      </g>
    </g>
  );
}

/** A figure seen through the window: broad flat torso, small head, one long arm that swings up to shake hands. */
function Person({ side }: { side: "l" | "r" }) {
  const l = side === "l";
  const d = l ? 1 : -1;
  const skin = l ? C.teal : C.sky;
  return (
    <g className={`a hs-person hs-person-${side}`}>
      <path d="M-40,90 L-40,20 C-40,-2 -26,-14 -8,-14 L8,-14 C26,-14 40,-2 40,20 L40,90 Z" fill={l ? C.blue : C.green} />
      <rect x="-5.5" y="-24" width="11" height="16" rx="4" fill={skin} />
      <path d="M-9,-14 L0,-1 L9,-14 Z" fill={skin} />
      <circle cx="0" cy="-33" r="12.5" fill={skin} />
      {l
        ? <path d="M-13.5,-32 C-16,-52 16,-52 13.5,-32 C9,-42 -4,-44 -13.5,-32 Z" fill={C.navy} />
        : <><circle cx="9" cy="-49" r="6.5" fill={C.navy} /><path d="M-14,-29 C-17,-51 17,-51 14,-29 C12,-40 2,-43 -14,-29 Z" fill={C.navy} /></>}
      <g transform={`translate(${d * 28} 8)`}>
        <g className="a hs-arm">
          <rect x="-8.5" y="-8.5" width="17" height="50" rx="8.5" fill={l ? C.blueLight : C.greenLight} />
          <circle cx="0" cy="44" r="9" fill={skin} />
        </g>
      </g>
    </g>
  );
}

export function HeroScene({ scene, frozen, jump }: { scene: number | null; frozen?: boolean; jump?: string }) {
  return (
    <svg className="hs" viewBox="30 36 540 344" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"
      data-scene={scene ?? undefined} data-frozen={frozen ? "" : undefined} data-jump={jump || undefined}>
      <defs>
        <clipPath id="hs-room-clip"><rect x="-117" y="-105" width="234" height="210" rx="8" /></clipPath>
      </defs>

      {/* Backdrop: one soft field and a handful of loose shapes. Always there. */}
      <path d="M118,128 C176,44 424,52 486,134 C544,212 506,322 384,334 C262,346 88,330 88,232 C88,184 98,156 118,128 Z" fill={C.navyUp} opacity="0.55" />
      <g className="hs-deco">
        <path d="M56,98 q7,-10 14,0 t14,0 t14,0 t14,0" fill="none" stroke={C.green} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M510,78 h16 M518,70 v16" fill="none" stroke={C.teal} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="68" cy="182" r="7" fill="none" stroke={C.sky} strokeWidth="3.5" />
        <path d="M536,128 l11,18 h-22 Z" fill={C.blue} />
        <path d="M524,214 a13,13 0 0 1 26,0 Z" fill={C.green} />
        <g fill={C.sky} opacity="0.7">
          {[0, 1, 2].map((i) => [0, 1, 2].map((j) => <circle key={`${i}${j}`} cx={508 + i * 11} cy={262 + j * 11} r="2" />))}
        </g>
        <path d="M70,296 h12 M76,290 v12" fill="none" stroke={C.paper} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      </g>
      <rect x="24" y="330" width="552" height="18" rx="9" fill={C.navyUp} />
      <rect x="24" y="330" width="552" height="4" rx="2" fill={C.deep} />

      {/* Act 3: the specks on the horizon the glass stops over. */}
      <g className="a hs-tiny" fill={C.sky}>
        <rect x="-13" y="-9" width="7" height="9" rx="1" /><rect x="-4" y="-14" width="8" height="14" rx="1" /><rect x="6" y="-7" width="8" height="7" rx="1" />
      </g>

      {/* Acts 3 and 4: the institutions. Each is drawn standing on its own origin. */}
      <g className="hs-town">
        <g className="a hs-b hs-b1">
          <rect x="-50" y="-70" width="100" height="62" fill={C.sky} />
          <rect x="-9" y="-46" width="18" height="38" rx="9" fill={C.navy} />
          {[-47, -31, 21, 37].map((x) => <rect key={x} x={x} y="-70" width="10" height="62" fill={C.paper} />)}
          {[-47, -31, 21, 37].map((x) => <rect key={x} x={x + 6} y="-70" width="4" height="62" fill={C.shade} />)}
          <rect x="-56" y="-80" width="112" height="10" rx="1.5" fill={C.white} />
          <path d="M-62,-80 L0,-116 L62,-80 Z" fill={C.paper} />
          <path d="M0,-116 L62,-80 L0,-80 Z" fill={C.shade} />
          <circle cx="0" cy="-92" r="6" fill={C.green} />
          <rect x="-60" y="-8" width="120" height="4" rx="1" fill={C.white} />
          <rect x="-66" y="-4" width="132" height="4" rx="1" fill={C.shade} />
        </g>
        <g className="a hs-b hs-b3">
          <rect x="30" y="-122" width="13" height="60" fill={C.paper} />
          <rect x="37" y="-122" width="6" height="60" fill={C.shade} />
          <rect x="28" y="-126" width="17" height="6" rx="2" fill={C.green} />
          <path d="M-52,0 L-52,-90 L-18,-66 L-18,-90 L16,-66 L16,-90 L52,-66 L52,0 Z" fill={C.mint} />
          <path d="M-52,-90 L-18,-66 L-52,-66 Z M-18,-90 L16,-66 L-18,-66 Z M16,-90 L52,-66 L16,-66 Z" fill={C.mintLight} />
          <rect x="-42" y="-50" width="52" height="18" rx="2" fill={C.navy} />
          <rect x="-42" y="-50" width="16" height="18" rx="2" className="a hs-lit hs-lit-3" />
          <path d="M-25,-50 V-32 M-7.5,-50 V-32" stroke={C.mint} strokeWidth="2" />
          <rect x="22" y="-36" width="20" height="36" rx="2" fill={C.navy} />
          <rect x="-56" y="-3" width="112" height="3" rx="1" fill={C.white} />
        </g>
        <g className="a hs-b hs-b2">
          <rect x="-50" y="-122" width="100" height="122" fill={C.paper} />
          <rect x="-56" y="-128" width="112" height="8" rx="2" fill={C.white} />
          <path d="M34,-128 V-152" stroke={C.paper} strokeWidth="2" strokeLinecap="round" />
          <path d="M34,-152 L51,-146.5 L34,-141 Z" fill={C.green} />
          {WIN_Y.map((y) => WIN_X.map((x) => <rect key={`${x}${y}`} x={x} y={y} width="20" height="18" rx="2" fill={C.navy} />))}
          <rect x="-36" y="-108" width="20" height="18" rx="2" className="a hs-lit" />
          <rect x="16" y="-108" width="20" height="18" rx="2" className="a hs-lit hs-lit-2" />
          <rect x="-36" y="-56" width="20" height="18" rx="2" className="a hs-lit hs-lit-3" />
          <rect x="-10" y="-82" width="20" height="18" rx="2" className="a hs-lit hs-lit-key" />
          <rect x="-36" y="-28" width="20" height="16" rx="2" fill={C.navy} /><rect x="16" y="-28" width="20" height="16" rx="2" fill={C.navy} />
          <rect x="-11" y="-30" width="22" height="30" rx="2" fill={C.navy} />
          <rect x="-16" y="-36" width="32" height="5" rx="2" fill={C.green} />
          <rect x="-58" y="-3" width="116" height="3" rx="1" fill={C.white} />
        </g>
      </g>

      {/* Act 2: the star. Five points on a round core; the points draw back and the core is the circle that grows. */}
      <g className="a hs-star">
        {SPIKES.map((deg) => (
          <g key={deg} transform={`rotate(${deg}) translate(0 -14.5)`}>
            <path className="hs-spike" d="M-10.6,0.5 L0,-31 L10.6,0.5 Z" fill={C.teal} stroke={C.teal} strokeWidth="3" strokeLinejoin="round" />
          </g>
        ))}
        <circle r="19.5" fill={C.teal} />
      </g>
      <g transform="translate(300 150)">
        {[["-58px", "-34px", 3], ["-12px", "-66px", 2.4], ["46px", "-50px", 3.4], ["66px", "8px", 2.4], ["30px", "58px", 3], ["-40px", "50px", 2.4], ["-68px", "12px", 2]].map(([dx, dy, r], i) => (
          <circle key={i} className="a hs-glint" r={r} style={css({ "--dx": dx as string, "--dy": dy as string, "--i": String(i) })} />
        ))}
      </g>

      {/* The magnifying glass. */}
      <g className="a hs-lens">
        <g transform="rotate(45) translate(45 0)">
          <g className="a hs-handle">
            <rect x="0" y="-4.5" width="14" height="9" fill={C.shade} />
            <rect x="10" y="-8" width="46" height="16" rx="8" fill={C.green} />
            <rect x="10" y="-8" width="9" height="16" rx="3" fill={C.paper} />
          </g>
        </g>
        <circle r="44" fill={C.sky} opacity="0.22" />
        <path d="M-29,-11 A31,31 0 0 1 -11,-29" fill="none" stroke={C.white} strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
        <circle r="44" fill="none" stroke={C.paper} strokeWidth="6" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Act 4: the window of the institute, the two people, the handshake. Cut to the same proportions as the
          building's window, so the push-in lands on it exactly. */}
      <g className="a hs-room">
        <rect x="-187" y="-140" width="374" height="280" rx="24" fill={C.paper} />
        <rect x="-117" y="-105" width="234" height="210" rx="8" fill={C.deep} />
        <g clipPath="url(#hs-room-clip)">
          <path d="M-52,-105 L-12,-105 L-104,105 L-144,105 Z M14,-105 L30,-105 L-62,105 L-78,105 Z" fill={C.white} opacity="0.07" />
          <Person side="l" />
          <Person side="r" />
          <g className="a hs-clasp">
            <path d="M-1,50 H-4 A9.5,9.5 0 0 0 -4,69 H-1 Z" fill={C.teal} />
            <path d="M-1,50 H5 A9.5,9.5 0 0 1 5,69 H-1 Z" fill={C.sky} />
          </g>
        </g>
        <rect x="-117" y="-105" width="234" height="210" rx="8" fill="none" stroke={C.white} strokeWidth="6" />
        <rect x="-126" y="116" width="252" height="5" fill={C.shade} />
        <rect x="-132" y="105" width="264" height="11" rx="3" fill={C.white} />
      </g>

      {/* The rocket. Outer group rides the flight path; the inner one carries the pre-launch tremble. */}
      <g className="a hs-rocket">
        <g className="hs-rocket-in">
          <g transform="translate(0 30)">
            <g className="a hs-flame">
              <path className="a hs-trail" d="M-7,34 V62 M0,40 V96 M7,34 V54" fill="none" stroke={C.paper} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
              <g className="hs-flame-in">
                <path d="M-8.5,0 C-9,14 -4,22 0,34 C4,22 9,14 8.5,0 Z" fill={C.teal} />
                <path d="M-4.5,0 C-4.5,7 -2,11 0,17 C2,11 4.5,7 4.5,0 Z" fill={C.white} />
              </g>
            </g>
          </g>
          <path d="M-13,4 C-23,11 -27,23 -26,36 L-12.5,25 Z" fill={C.green} />
          <path d="M13,4 C23,11 27,23 26,36 L12.5,25 Z" fill={C.greenDark} />
          <path d="M-8,24 L8,24 L10,31 L-10,31 Z" fill={C.deep} />
          <path d="M0,-46 C15,-30 17,-4 13,25 L-13,25 C-17,-4 -15,-30 0,-46 Z" fill={C.paper} />
          <path d="M0,-46 C15,-30 17,-4 13,25 L4,25 C7,-2 6,-28 0,-46 Z" fill={C.shade} />
          <path d="M0,-46 C6.6,-39 10.8,-31 13,-22 L-13,-22 C-10.8,-31 -6.6,-39 0,-46 Z" fill={C.green} />
          <path d="M0,-46 C6.6,-39 10.8,-31 13,-22 L5.2,-22 C4.4,-31 2.8,-39 0,-46 Z" fill={C.greenDark} />
          <rect x="-14.6" y="12" width="29.2" height="3.5" fill={C.blue} />
          <circle cx="0" cy="-6" r="8" fill={C.blue} />
          <circle cx="0" cy="-6" r="5" fill={C.navy} />
          <circle cx="-1.8" cy="-7.8" r="1.5" fill={C.sky} />
        </g>
      </g>

      {/* Launch pad and its smoke, in front of the rocket so the exhaust starts behind the deck. */}
      <g className="a hs-pad">
        <path d="M-37,-7 L-37,-80 M-30,-7 L-30,-80 M-37,-20 L-30,-32 L-37,-44 L-30,-56 L-37,-68 L-30,-80 M-37,-80 L-30,-80 M-30,-54 L-17,-54" fill="none" stroke={C.sky} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-34,0 L-27,-7 L27,-7 L34,0 Z" fill={C.sky} />
        <rect x="-40" y="0" width="80" height="4" rx="2" fill={C.paper} />
      </g>
      <g transform="translate(150 324)">
        <circle className="a hs-smoke" style={css({ "--dx": "-50px", "--i": "1", "--dy": "-1px" })} r="14" fill={C.paper} />
        <circle className="a hs-smoke" style={css({ "--dx": "-30px", "--i": "0", "--dy": "-15px" })} r="12" fill={C.shade} />
        <circle className="a hs-smoke" style={css({ "--dx": "-8px", "--i": "2", "--dy": "-4px" })} r="10" fill={C.paper} />
        <circle className="a hs-smoke" style={css({ "--dx": "18px", "--i": "0", "--dy": "-13px" })} r="13" fill={C.shade} />
        <circle className="a hs-smoke" style={css({ "--dx": "44px", "--i": "1", "--dy": "-2px" })} r="16" fill={C.paper} />
      </g>

      {/* Act 4: the firework over the handshake. */}
      <circle className="a hs-spark" r="4" fill={C.white} />
      <Burst className="hs-burst-1" />
      <Burst className="hs-burst-2" r={0.62} />
      <Burst className="hs-burst-3" r={0.5} />
    </svg>
  );
}
