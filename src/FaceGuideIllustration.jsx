/* ═══════════════════════════════════════════
   RHEI — Luxury Face Guide Illustration
   Animated: traveling dots + marching dashes + pulsing zone glow
   ═══════════════════════════════════════════ */

const GOLD    = "#C49A4B";
const GOLD_HI = "#D4AD6A";

// ── Animated path definitions per zone ───────────────────────────────────────
// Each zone has: highlight shape(s), stroke paths (dashed), motion paths (traveling dot)
const ZONES = {
  full: {
    highlights: [{ type:"ellipse", cx:100, cy:126, rx:62, ry:88 }],
    paths: [],
  },
  neck: {
    highlights: [{ type:"ellipse", cx:100, cy:226, rx:42, ry:18 }],
    paths: [
      { id:"n1", d:"M 88,206 L 88,236", dur:"1.6s" },
      { id:"n2", d:"M 112,206 L 112,236", dur:"1.6s" },
    ],
  },
  jawline: {
    highlights: [{ type:"path", d:"M100,208 Q70,187 52,162 Q54,154 60,155 Q76,178 100,196 Q124,178 140,155 Q146,154 148,162 Q130,187 100,208Z" }],
    paths: [
      { id:"jl", d:"M 100,208 Q 68,186 50,160", dur:"2s" },
      { id:"jr", d:"M 100,208 Q 132,186 150,160", dur:"2s" },
    ],
  },
  cheeks: {
    highlights: [
      { type:"ellipse", cx:56, cy:124, rx:22, ry:30 },
      { type:"ellipse", cx:144, cy:124, rx:22, ry:30 },
    ],
    paths: [
      { id:"cl", d:"M 60,142 Q 48,124 46,108", dur:"1.8s" },
      { id:"cr", d:"M 140,142 Q 152,124 154,108", dur:"1.8s" },
    ],
  },
  undereye: {
    highlights: [
      { type:"ellipse", cx:72, cy:107, rx:19, ry:7 },
      { type:"ellipse", cx:128, cy:107, rx:19, ry:7 },
    ],
    paths: [
      { id:"ul", d:"M 60,105 L 46,101", dur:"1.4s" },
      { id:"ur", d:"M 140,105 L 154,101", dur:"1.4s" },
    ],
  },
  orbital: {
    highlights: [
      { type:"ellipse", cx:72, cy:104, rx:20, ry:10 },
      { type:"ellipse", cx:128, cy:104, rx:20, ry:10 },
    ],
    paths: [
      { id:"ol", d:"M 56,96 Q 72,86 88,96 Q 88,114 72,116 Q 56,114 56,96", dur:"2.5s", dotSize:3 },
      { id:"or", d:"M 112,96 Q 128,86 144,96 Q 144,114 128,116 Q 112,114 112,96", dur:"2.5s", dotSize:3 },
    ],
  },
  brow: {
    highlights: [
      { type:"ellipse", cx:72, cy:81, rx:20, ry:8 },
      { type:"ellipse", cx:128, cy:81, rx:20, ry:8 },
    ],
    paths: [
      { id:"bl", d:"M 57,79 L 44,75", dur:"1.3s" },
      { id:"br", d:"M 143,79 L 156,75", dur:"1.3s" },
    ],
  },
  forehead: {
    highlights: [{ type:"ellipse", cx:100, cy:62, rx:50, ry:27 }],
    paths: [
      { id:"fl", d:"M 82,72 L 82,40", dur:"1.6s" },
      { id:"fc", d:"M 100,72 L 100,36", dur:"1.6s" },
      { id:"fr", d:"M 118,72 L 118,40", dur:"1.6s" },
    ],
  },
  temples: {
    highlights: [
      { type:"circle", cx:38, cy:90, r:18 },
      { type:"circle", cx:162, cy:90, r:18 },
    ],
    paths: [
      { id:"tl", d:"M 52,90 A 14,14 0 1 1 51.99,90.01", dur:"2.2s", dotSize:3.5, loop:true },
      { id:"tr", d:"M 148,90 A 14,14 0 0 0 148.01,90.01", dur:"2.2s", dotSize:3.5, loop:true },
    ],
  },
  nodes: {
    highlights: [
      { type:"circle", cx:38, cy:92, r:16 },
      { type:"circle", cx:162, cy:92, r:16 },
    ],
    paths: [
      { id:"ndl", d:"M 38,78 A 14,14 0 1 1 37.99,78.01", dur:"1.8s", dotSize:3, loop:true },
      { id:"ndr", d:"M 162,78 A 14,14 0 0 0 162.01,78.01", dur:"1.8s", dotSize:3, loop:true },
    ],
  },
  nasolabial: {
    highlights: [
      { type:"ellipse", cx:80, cy:134, rx:9, ry:16, transform:"rotate(-8,80,134)" },
      { type:"ellipse", cx:120, cy:134, rx:9, ry:16, transform:"rotate(8,120,134)" },
    ],
    paths: [
      { id:"nsl", d:"M 80,144 Q 66,128 63,116", dur:"1.9s" },
      { id:"nsr", d:"M 120,144 Q 134,128 137,116", dur:"1.9s" },
    ],
  },
  marionette: {
    highlights: [
      { type:"ellipse", cx:78, cy:157, rx:12, ry:14 },
      { type:"ellipse", cx:122, cy:157, rx:12, ry:14 },
    ],
    paths: [
      { id:"ml", d:"M 78,164 L 63,128", dur:"1.8s" },
      { id:"mr", d:"M 122,164 L 137,128", dur:"1.8s" },
    ],
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function FaceGuideIllustration({ zone = "full", size = 180 }) {
  const def = ZONES[zone] || ZONES.full;
  const uid = zone; // used as prefix for unique SVG ids

  // Marching dash total = dasharray sum (6+4=10) * 2 = -20 for one full cycle
  const cssId = `rhei-face-${uid}`;

  return (
    <div style={{ position:"relative", width:size, height:size * 1.28, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`
        @keyframes ${cssId}-pulse {
          0%,100% { opacity: 0.16; }
          50%      { opacity: 0.42; }
        }
        @keyframes ${cssId}-ring {
          0%,100% { opacity: 0.28; }
          50%      { opacity: 0.65; }
        }
        @keyframes ${cssId}-march {
          to { stroke-dashoffset: -20; }
        }
        .${cssId}-fill  { animation: ${cssId}-pulse 2s ease-in-out infinite; }
        .${cssId}-ring  { animation: ${cssId}-ring  2s ease-in-out infinite; }
        .${cssId}-march { animation: ${cssId}-march 0.7s linear infinite; stroke-dasharray: 6 4; }
      `}</style>

      <svg
        viewBox="0 0 200 260"
        width={size}
        height={size * 1.28}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow:"visible" }}
      >
        {/* ── Defs: all motion paths ── */}
        <defs>
          <filter id={`${cssId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {def.paths.map(p => (
            <path key={`def-${p.id}`} id={`${cssId}-${p.id}`} d={p.d}/>
          ))}
        </defs>

        {/* ── Zone highlight fills ── */}
        {def.highlights.map((h, i) => {
          const fill = `rgba(196,154,75,1)`;
          if (h.type === "ellipse") return (
            <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry}
              fill={fill} className={`${cssId}-fill`} transform={h.transform}/>
          );
          if (h.type === "circle") return (
            <circle key={i} cx={h.cx} cy={h.cy} r={h.r}
              fill={fill} className={`${cssId}-fill`}/>
          );
          if (h.type === "path") return (
            <path key={i} d={h.d} fill={fill} className={`${cssId}-fill`}/>
          );
          return null;
        })}

        {/* ── Zone highlight rings (glowing border) ── */}
        {def.highlights.map((h, i) => {
          const stroke = GOLD_HI;
          const sw = 1.2;
          if (h.type === "ellipse") return (
            <ellipse key={`r${i}`} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry}
              fill="none" stroke={stroke} strokeWidth={sw}
              className={`${cssId}-ring`} transform={h.transform}/>
          );
          if (h.type === "circle") return (
            <circle key={`r${i}`} cx={h.cx} cy={h.cy} r={h.r}
              fill="none" stroke={stroke} strokeWidth={sw}
              className={`${cssId}-ring`}/>
          );
          if (h.type === "path") return (
            <path key={`r${i}`} d={h.d}
              fill="none" stroke={stroke} strokeWidth={sw}
              className={`${cssId}-ring`}/>
          );
          return null;
        })}

        {/* ── Base face: neck ── */}
        <ellipse cx="100" cy="226" rx="42" ry="20"
          fill="none" stroke="rgba(196,154,75,0.22)" strokeWidth="1"/>
        {/* Collarbone suggestion */}
        <path d="M 60,244 Q 100,238 140,244"
          fill="none" stroke="rgba(196,154,75,0.14)" strokeWidth="1"/>

        {/* ── Base face: outline ── */}
        <path
          d="M100,33 C68,33 40,58 40,96 C40,138 46,170 60,188 C72,204 86,214 100,216 C114,214 128,204 140,188 C154,170 160,138 160,96 C160,58 132,33 100,33Z"
          fill="none" stroke="rgba(196,154,75,0.52)" strokeWidth="1.3"/>

        {/* ── Ears ── */}
        <path d="M40,98 C31,94 27,102 27,110 C27,118 31,126 40,122"
          fill="none" stroke="rgba(196,154,75,0.28)" strokeWidth="1"/>
        <path d="M160,98 C169,94 173,102 173,110 C173,118 169,126 160,122"
          fill="none" stroke="rgba(196,154,75,0.28)" strokeWidth="1"/>

        {/* ── Eyebrows ── */}
        <path d="M54,79 Q72,70 91,75"
          fill="none" stroke="rgba(196,154,75,0.65)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M109,75 Q128,70 146,79"
          fill="none" stroke="rgba(196,154,75,0.65)" strokeWidth="1.5" strokeLinecap="round"/>

        {/* ── Eyes ── */}
        <path d="M57,93 Q72,83 87,93 Q72,103 57,93Z"
          fill="rgba(196,154,75,0.14)" stroke="rgba(196,154,75,0.55)" strokeWidth="1"/>
        <circle cx="72" cy="93" r="3.5" fill="rgba(196,154,75,0.35)"/>
        <path d="M113,93 Q128,83 143,93 Q128,103 113,93Z"
          fill="rgba(196,154,75,0.14)" stroke="rgba(196,154,75,0.55)" strokeWidth="1"/>
        <circle cx="128" cy="93" r="3.5" fill="rgba(196,154,75,0.35)"/>

        {/* ── Nose ── */}
        <path d="M100,100 L96,120 Q100,126 104,120Z"
          fill="none" stroke="rgba(196,154,75,0.40)" strokeWidth="1"/>
        <path d="M91,124 Q100,129 109,124"
          fill="none" stroke="rgba(196,154,75,0.40)" strokeWidth="1" strokeLinecap="round"/>

        {/* ── Lips ── */}
        <path d="M82,141 Q91,136 100,138 Q109,136 118,141 Q109,152 100,154 Q91,152 82,141Z"
          fill="rgba(196,154,75,0.22)" stroke="rgba(196,154,75,0.55)" strokeWidth="1"/>
        <path d="M82,141 Q100,145 118,141"
          fill="none" stroke="rgba(196,154,75,0.35)" strokeWidth="0.8"/>

        {/* ── Cheekbone hints ── */}
        <path d="M46,122 Q57,116 68,118"
          fill="none" stroke="rgba(196,154,75,0.22)" strokeWidth="0.8"/>
        <path d="M132,118 Q143,116 154,122"
          fill="none" stroke="rgba(196,154,75,0.22)" strokeWidth="0.8"/>

        {/* ── Animated stroke paths (marching dashes) ── */}
        {def.paths.map(p => (
          <use
            key={`stroke-${p.id}`}
            href={`#${cssId}-${p.id}`}
            fill="none"
            stroke={GOLD}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.7"
            className={`${cssId}-march`}
          />
        ))}

        {/* ── Traveling dots along each path ── */}
        {def.paths.map(p => (
          <circle key={`dot-${p.id}`} r={p.dotSize || 4} fill={GOLD_HI} filter={`url(#${cssId}-glow)`}>
            <animateMotion dur={p.dur} repeatCount="indefinite" rotate="auto">
              <mpath href={`#${cssId}-${p.id}`}/>
            </animateMotion>
          </circle>
        ))}

        {/* ── Dot trail (second smaller dot, offset in time) ── */}
        {def.paths.map(p => (
          <circle key={`trail-${p.id}`} r={(p.dotSize || 4) * 0.55} fill={GOLD} opacity="0.45">
            <animateMotion dur={p.dur} repeatCount="indefinite" rotate="auto" begin={`-${parseFloat(p.dur)*0.28}s`}>
              <mpath href={`#${cssId}-${p.id}`}/>
            </animateMotion>
          </circle>
        ))}

      </svg>
    </div>
  );
}
