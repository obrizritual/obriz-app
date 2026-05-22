// ════════════════════════════════════════════════════════════════
// RHEI — AnimatedRitualStep
//
// Renders one ritual step as a feathered portrait with animated
// gold gesture overlays.
//
// Animations are pure CSS keyframes + SVG SMIL (for orbits).
//   - arrow / curve: stroke-dashoffset → line draws itself
//   - circle: STATIC dashed circle path + ORBITING dot (the fingertip)
//   - hold: concentric pulse outward → sonar ping
//   - point: opacity pulse → dot fades in/out
//   - wave: sinusoidal path between two points
// ════════════════════════════════════════════════════════════════
import { RITUALS, LANDMARKS, resolveLandmark } from "./RitualSteps";

// Slightly softer gold than v1 — less saturated reads more refined,
// less "honey-tacky" on the brown ground.
const GOLD = "#E4C38A";
const GOLD_BRIGHT = "#F2D9A6";

// Convert a list of landmark refs to an SVG path using smooth bezier curves
function pathFromPoints(points, landmarks) {
  const pts = points.map(p => resolveLandmark(p, landmarks));
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M ${pts[0][0]},${pts[0][1]} L ${pts[1][0]},${pts[1][1]}`;
  }
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// A single animated gesture. Stroke widths are raw pixels because the
// SVG uses vectorEffect="non-scaling-stroke".
function Gesture({ gesture, landmarks, index }) {
  const delay = gesture.delay || 0;
  // Reduced from 12 → 10 default so lines read refined, not tacky.
  const stroke = gesture.width != null ? gesture.width : 10;
  const color = gesture.color || GOLD;
  // Softer glow — 4px close + 8px halo (was 6 + 12) — luminous but restrained.
  const glow = `drop-shadow(0 0 4px ${color}cc) drop-shadow(0 0 8px ${color}55)`;

  if (gesture.type === "arrow" || gesture.type === "curve") {
    const d = pathFromPoints(gesture.points, landmarks);
    const last = resolveLandmark(gesture.points[gesture.points.length - 1], landmarks);
    const prev = resolveLandmark(gesture.points[gesture.points.length - 2], landmarks);
    const dx = last[0] - prev[0];
    const dy = last[1] - prev[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const head = 0.028;
    const spread = 0.014;
    const showHead = gesture.type === "arrow";
    return (
      <g style={{ animationDelay: `${delay}s` }}>
        <path d={d}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="rhei-arrow"
              style={{ filter: glow, animationDelay: `${delay}s` }}
        />
        {showHead && (
          <g className="rhei-arrowhead" style={{ animationDelay: `${delay + 1.6}s` }}>
            <line x1={last[0] - ux*head + px*spread} y1={last[1] - uy*head + py*spread}
                  x2={last[0]} y2={last[1]}
                  stroke={color} strokeWidth={stroke} strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: glow }}/>
            <line x1={last[0] - ux*head - px*spread} y1={last[1] - uy*head - py*spread}
                  x2={last[0]} y2={last[1]}
                  stroke={color} strokeWidth={stroke} strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: glow }}/>
          </g>
        )}
      </g>
    );
  }

  if (gesture.type === "circle") {
    // Static dashed circle path + ORBITING dot showing the fingertip.
    // This reads unmistakably as "circle your finger here at this point."
    const [cx, cy] = resolveLandmark(gesture.center, landmarks);
    const r = gesture.radius || 0.04;
    const dotR = 0.014; // fingertip dot — ~3.5px at 260px display
    return (
      <g style={{ animationDelay: `${delay}s` }} className="rhei-circle-fade-in">
        {/* Center anchor — where the press point sits */}
        <circle cx={cx} cy={cy} r={0.005}
                fill={color}
                opacity={0.8}
                style={{ filter: `drop-shadow(0 0 4px ${color}aa)` }}/>
        {/* Static orbit path — thin, dashed, low opacity */}
        <circle cx={cx} cy={cy} r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke * 0.55}
                strokeDasharray="0.012 0.016"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={0.55}/>
        {/* Orbiting fingertip — uses native SVG animateTransform for
            reliable rotation around (cx, cy) regardless of CSS scaling. */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="3.2s"
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
          {/* Soft halo behind the dot */}
          <circle cx={cx + r} cy={cy} r={dotR * 2.2}
                  fill={color} opacity={0.3}
                  style={{ filter: "blur(2px)" }}/>
          {/* The fingertip itself */}
          <circle cx={cx + r} cy={cy} r={dotR}
                  fill={GOLD_BRIGHT}
                  style={{ filter: `drop-shadow(0 0 5px ${color})` }}/>
        </g>
      </g>
    );
  }

  if (gesture.type === "hold") {
    const [cx, cy] = resolveLandmark(gesture.center, landmarks);
    const r = gesture.radius || 0.035;
    return (
      <g>
        {[0, 0.55, 1.1].map((sd, i) => (
          <circle key={i}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke * 0.55}
                  vectorEffect="non-scaling-stroke"
                  className="rhei-ping"
                  style={{ animationDelay: `${delay + sd}s`,
                           transformOrigin: `${cx*100}% ${cy*100}%`,
                           transformBox: "view-box",
                           filter: glow }}
          />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.26}
                fill={GOLD_BRIGHT}
                className="rhei-pulse-dot"
                style={{ animationDelay: `${delay}s`,
                         transformOrigin: `${cx*100}% ${cy*100}%`,
                         transformBox: "view-box",
                         filter: `drop-shadow(0 0 6px ${color}bb)` }}/>
      </g>
    );
  }

  if (gesture.type === "point") {
    const [cx, cy] = resolveLandmark(gesture.center, landmarks);
    const r = gesture.radius || 0.018;
    return (
      <g style={{ animationDelay: `${delay}s`,
                  transformOrigin: `${cx*100}% ${cy*100}%`,
                  transformBox: "view-box" }}
         className="rhei-pulse-dot">
        <circle cx={cx} cy={cy} r={r * 2.4}
                fill={color}
                opacity={0.25}/>
        <circle cx={cx} cy={cy} r={r}
                fill={GOLD_BRIGHT}
                style={{ filter: `drop-shadow(0 0 8px ${color}cc)` }}/>
      </g>
    );
  }

  if (gesture.type === "wave") {
    const a = resolveLandmark(gesture.from, landmarks);
    const b = resolveLandmark(gesture.to, landmarks);
    const steps = 32;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const amp = 0.018;
    let d = `M ${a[0]},${a[1]}`;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const baseX = a[0] + dx * t;
      const baseY = a[1] + dy * t;
      const damp = Math.sin(Math.PI * t);
      const wave = Math.sin(Math.PI * 3 * t) * amp * damp;
      const x = baseX + px * wave;
      const y = baseY + py * wave;
      d += ` L ${x},${y}`;
    }
    return (
      <path d={d}
            fill="none"
            stroke={color}
            strokeWidth={stroke * 0.9}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="rhei-arrow"
            style={{ animationDelay: `${delay}s`, filter: glow }}/>
    );
  }

  return null;
}

export default function AnimatedRitualStep({
  ritualId,
  stepIndex,
  size = 280,
  width,
  height,
  showFrame = true,
  showGestures = true,   // NEW: when false, only render the portrait (used by overview screen)
}) {
  const ritual = RITUALS[ritualId];
  if (!ritual) return null;
  const step = ritual.steps[stepIndex - 1];
  if (!step) return null;
  const woman = ritual.woman;
  const landmarks = LANDMARKS[woman];

  const w = width != null ? width : size;
  const h = height != null ? height : size * 1.25;

  return (
    <div
      key={`${ritualId}-${stepIndex}-${showGestures}`}
      className="rhei-step-enter"
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 14,
        overflow: "hidden",
      }}>
      <img
        src={`/ritual-source-photos/${woman}-clean.png`}
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center 28%",
          display: "block",
        }}
      />
      {showGestures && (
        <svg
          viewBox="0 0 1 1.25"
          preserveAspectRatio="none"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            pointerEvents: "none",
          }}
        >
          <g transform="scale(1, 1.25)">
            {step.gestures.map((g, i) => (
              <Gesture key={i} gesture={g} landmarks={landmarks} index={i}/>
            ))}
          </g>
        </svg>
      )}
      {showFrame && (
        <div style={{
          position: "absolute", inset: 0,
          pointerEvents: "none",
          fontFamily: "'IBM Plex Mono', 'Geist Mono', monospace",
          color: "rgba(242, 235, 220, 0.85)",
        }}>
          {[
            { top: 8, left: 8, transform: "rotate(0deg)" },
            { top: 8, right: 8, transform: "rotate(90deg)" },
            { bottom: 8, left: 8, transform: "rotate(-90deg)" },
            { bottom: 8, right: 8, transform: "rotate(180deg)" },
          ].map((pos, i) => (
            <div key={i} style={{
              position: "absolute", ...pos,
              width: 12, height: 12,
              borderTop: "1px solid rgba(242,235,220,0.45)",
              borderLeft: "1px solid rgba(242,235,220,0.45)",
              transformOrigin: "top left",
            }}/>
          ))}
          <span style={{
            position: "absolute", top: 10, left: 28,
            fontSize: 8, letterSpacing: "0.18em",
            color: "rgba(242,235,220,0.7)",
          }}>{ritual.label}</span>
          {showGestures && (
            <span style={{
              position: "absolute", top: 10, right: 28,
              fontSize: 8, letterSpacing: "0.18em",
              color: "rgba(242,235,220,0.45)",
            }}>RHEI · STEP</span>
          )}
          {showGestures && (
            <span style={{
              position: "absolute", bottom: 10, left: 28,
              fontSize: 8, letterSpacing: "0.18em",
              color: "#E4C38A",
            }}>{step.step}</span>
          )}
          {showGestures && step.note && (
            <span style={{
              position: "absolute", bottom: 10, right: 28,
              fontSize: 8, letterSpacing: "0.18em",
              color: "rgba(242,235,220,0.5)",
            }}>{step.note}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function hasAnimatedSteps(ritualId) {
  return Boolean(RITUALS[ritualId]);
}
