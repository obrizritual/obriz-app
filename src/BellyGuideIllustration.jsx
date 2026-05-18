/* ═══════════════════════════════════════════
   RHEI — Luxury Belly / Torso Guide Illustration
   Matches FaceGuideIllustration aesthetic: gold linework, pulsing zone glows,
   marching dashes. Used for abdominal rituals (Belly Flow, etc.) where the
   face illustration would be anatomically wrong.
   ═══════════════════════════════════════════ */

const GOLD    = "#C49A4B";
const GOLD_HI = "#D4AD6A";

// ── Animated path / shape definitions per zone ──
// viewBox is 200 wide × 260 tall, same proportions as FaceGuide so the existing
// container dimensions work without changes. Coordinates approximate a relaxed
// torso silhouette: shoulders at top, soft waist around y=160, hips at bottom.
const ZONES = {
  // Default — gentle full-abdomen breathing glow
  full: {
    highlights: [{ type: "ellipse", cx: 100, cy: 170, rx: 56, ry: 64 }],
    paths: [],
  },
  // Hip-crease lymph nodes (inguinal) — both sides pulse
  inguinal: {
    highlights: [
      { type: "circle", cx: 70, cy: 232, r: 11 },
      { type: "circle", cx: 130, cy: 232, r: 11 },
    ],
    paths: [
      { id: "il", d: "M 70,222 A 10,10 0 1 1 69.99,222.01", dur: "1.8s", dotSize: 3, loop: true },
      { id: "ir", d: "M 130,222 A 10,10 0 0 0 130.01,222.01", dur: "1.8s", dotSize: 3, loop: true },
    ],
  },
  // Diaphragm band — horizontal stripe just under the ribs
  diaphragm: {
    highlights: [{ type: "ellipse", cx: 100, cy: 120, rx: 50, ry: 12 }],
    paths: [
      { id: "dl", d: "M 56,120 Q 100,128 144,120", dur: "1.9s" },
      { id: "dr", d: "M 56,128 Q 100,136 144,128", dur: "2.1s" },
    ],
  },
  // Descending colon — left side downward strip
  "left-side": {
    highlights: [{ type: "ellipse", cx: 138, cy: 175, rx: 14, ry: 48 }],
    paths: [
      { id: "ls1", d: "M 138,128 L 138,222", dur: "1.7s" },
    ],
  },
  // Transverse + descending sweep across the top
  "top-sweep": {
    highlights: [
      { type: "path", d: "M 62,140 Q 100,128 138,140 L 138,170 Q 138,176 132,176 L 68,176 Q 62,176 62,170 Z" },
    ],
    paths: [
      { id: "ts1", d: "M 62,148 Q 100,136 138,148", dur: "2.1s" },
    ],
  },
  // Full colonic U — up the right, across the top, down the left
  "colon-path": {
    highlights: [
      { type: "path", d: "M 60,222 Q 56,222 56,216 L 56,142 Q 56,134 64,134 L 136,134 Q 144,134 144,142 L 144,216 Q 144,222 140,222 L 140,210 Q 140,148 132,148 L 68,148 Q 60,148 60,210 Z" },
    ],
    paths: [
      { id: "cp1", d: "M 60,222 L 60,150 Q 60,142 68,142 L 132,142 Q 140,142 140,150 L 140,222", dur: "2.4s", dotSize: 3, loop: true },
    ],
  },
  // Navel — central circle (clockwise colon massage)
  navel: {
    highlights: [{ type: "circle", cx: 100, cy: 170, r: 18 }],
    paths: [
      { id: "nv", d: "M 100,152 A 18,18 0 1 1 99.99,152.01", dur: "2.2s", dotSize: 4, loop: true },
    ],
  },
};

// ── Component ──
export default function BellyGuideIllustration({ zone = "full", size = 180 }) {
  const def = ZONES[zone] || ZONES.full;
  const uid = `belly-${zone}`;
  const cssId = `rhei-${uid}`;

  return (
    <div style={{ position: "relative", width: size, height: size * 1.28, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes ${cssId}-pulse {
          0%,100% { opacity: 0.16; }
          50%     { opacity: 0.42; }
        }
        @keyframes ${cssId}-ring {
          0%,100% { opacity: 0.28; }
          50%     { opacity: 0.65; }
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
        style={{ overflow: "visible" }}
      >
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

        {/* ── Base torso outline — relaxed silhouette, no face, no head ── */}
        {/* Shoulders + ribcage taper */}
        <path
          d="M 40,40 Q 50,30 70,28 Q 100,26 130,28 Q 150,30 160,40 Q 162,80 156,110 Q 152,128 148,160 Q 146,200 144,232 Q 142,244 130,246 Q 100,250 70,246 Q 58,244 56,232 Q 54,200 52,160 Q 48,128 44,110 Q 38,80 40,40 Z"
          fill="none"
          stroke="rgba(196,154,75,0.32)"
          strokeWidth="1.4"
        />
        {/* Subtle ribcage suggestion under collarbones */}
        <path d="M 58,76 Q 100,84 142,76"
          fill="none" stroke="rgba(196,154,75,0.18)" strokeWidth="1"/>
        <path d="M 64,98 Q 100,108 136,98"
          fill="none" stroke="rgba(196,154,75,0.14)" strokeWidth="1"/>
        {/* Navel — always visible as a small anchor point */}
        <circle cx="100" cy="170" r="2"
          fill="rgba(196,154,75,0.55)"/>
        {/* Inguinal crease hints — subtle V lines toward the hip nodes */}
        <path d="M 80,220 Q 90,228 100,228 Q 110,228 120,220"
          fill="none" stroke="rgba(196,154,75,0.14)" strokeWidth="1"/>

        {/* ── Marching-dash motion paths ── */}
        {def.paths.map(p => (
          <use key={`m-${p.id}`}
            href={`#${cssId}-${p.id}`}
            fill="none" stroke={GOLD} strokeWidth="1.6"
            className={`${cssId}-march`}/>
        ))}

        {/* ── Traveling dots along each motion path ── */}
        {def.paths.map(p => (
          <circle key={`d-${p.id}`} r={p.dotSize || 2.4} fill={GOLD_HI}
            filter={`url(#${cssId}-glow)`}>
            <animateMotion
              dur={p.dur || "1.8s"}
              repeatCount="indefinite"
              keyTimes="0;1"
              keyPoints={p.loop ? "0;1" : "0;1"}
            >
              <mpath href={`#${cssId}-${p.id}`}/>
            </animateMotion>
          </circle>
        ))}
      </svg>
    </div>
  );
}
