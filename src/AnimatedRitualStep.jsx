// ════════════════════════════════════════════════════════════════
// RHEI — AnimatedRitualStep
//
// Renders one ritual step as a feathered portrait with animated
// gold gesture overlays. Replaces the previous static PNG approach.
//
// Animations are pure CSS keyframes (no JS animation loop).
//   - arrow / curve: stroke-dashoffset animation → line draws itself
//   - circle: rotation + opacity pulse → spinning circle
//   - hold: concentric pulse outward → sonar ping
//   - point: opacity pulse → dot fades in and out
//   - wave: sinusoidal path traversal between two points
// ════════════════════════════════════════════════════════════════
import { RITUALS, LANDMARKS, resolveLandmark } from "./RitualSteps";

const GOLD = "#E4C48A";
const GOLD_BRIGHT = "#F5DCAA";

// Convert a list of landmark refs to an SVG path "M x,y L x,y …"
function pathFromPoints(points, landmarks) {
  const pts = points.map(p => resolveLandmark(p, landmarks));
  // Catmull-Rom-ish curve through points (smooth)
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M ${pts[0][0]},${pts[0][1]} L ${pts[1][0]},${pts[1][1]}`;
  }
  // Multiple points — use bezier curves through them
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

// A single animated gesture, rendered as one or more SVG primitives
function Gesture({ gesture, landmarks, index }) {
  const delay = gesture.delay || 0;
  const stroke = (gesture.width != null ? gesture.width : 8) * 0.0008; // px → relative-to-viewbox
  const color = gesture.color || GOLD;

  if (gesture.type === "arrow" || gesture.type === "curve") {
    const d = pathFromPoints(gesture.points, landmarks);
    const last = resolveLandmark(gesture.points[gesture.points.length - 1], landmarks);
    const prev = resolveLandmark(gesture.points[gesture.points.length - 2], landmarks);
    // Compute arrow head triangle pointing in direction of last segment
    const dx = last[0] - prev[0];
    const dy = last[1] - prev[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const head = 0.022;
    const spread = 0.012;
    const showHead = gesture.type === "arrow";
    return (
      <g style={{ animationDelay: `${delay}s` }} className="rhei-g-draw">
        <path d={d}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="rhei-arrow"
              style={{ filter: `drop-shadow(0 0 ${stroke*4} ${color}66)` }}
        />
        {showHead && (
          <g className="rhei-arrowhead" style={{ animationDelay: `${delay + 1.4}s` }}>
            <line x1={last[0] - ux*head + px*spread} y1={last[1] - uy*head + py*spread}
                  x2={last[0]} y2={last[1]}
                  stroke={color} strokeWidth={stroke} strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"/>
            <line x1={last[0] - ux*head - px*spread} y1={last[1] - uy*head - py*spread}
                  x2={last[0]} y2={last[1]}
                  stroke={color} strokeWidth={stroke} strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"/>
          </g>
        )}
      </g>
    );
  }

  if (gesture.type === "circle") {
    const [cx, cy] = resolveLandmark(gesture.center, landmarks);
    const r = gesture.radius || 0.04;
    return (
      <g style={{ animationDelay: `${delay}s`, transformOrigin: `${cx*100}% ${cy*100}%` }}
         className="rhei-g-rotate">
        <circle cx={cx} cy={cy} r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke * 0.7}
                strokeDasharray="0.012 0.020"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ filter: `drop-shadow(0 0 ${stroke*3} ${color}55)` }}
        />
      </g>
    );
  }

  if (gesture.type === "hold") {
    const [cx, cy] = resolveLandmark(gesture.center, landmarks);
    const r = gesture.radius || 0.035;
    // Three rings staggered for sonar ping effect
    return (
      <g style={{ animationDelay: `${delay}s` }}>
        {[0, 0.4, 0.8].map((sd, i) => (
          <circle key={i}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke * 0.6}
                  vectorEffect="non-scaling-stroke"
                  className="rhei-ping"
                  style={{ animationDelay: `${delay + sd}s`,
                           transformOrigin: `${cx*100}% ${cy*100}%`,
                           filter: `drop-shadow(0 0 ${stroke*3} ${color}55)` }}
          />
        ))}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={r * 0.25}
                fill={GOLD_BRIGHT}
                className="rhei-pulse-dot"
                style={{ animationDelay: `${delay}s` }}/>
      </g>
    );
  }

  if (gesture.type === "point") {
    const [cx, cy] = resolveLandmark(gesture.center, landmarks);
    const r = gesture.radius || 0.018;
    return (
      <g style={{ animationDelay: `${delay}s` }} className="rhei-pulse-dot">
        <circle cx={cx} cy={cy} r={r * 2.5}
                fill={color}
                opacity={0.20}
                style={{ filter: `blur(${r*1.5}px)` }}/>
        <circle cx={cx} cy={cy} r={r}
                fill={GOLD_BRIGHT}/>
      </g>
    );
  }

  if (gesture.type === "wave") {
    const a = resolveLandmark(gesture.from, landmarks);
    const b = resolveLandmark(gesture.to, landmarks);
    // Sinusoidal wavy path between a and b
    const steps = 24;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const amp = 0.012;
    let d = `M ${a[0]},${a[1]}`;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const baseX = a[0] + dx * t;
      const baseY = a[1] + dy * t;
      // Damp the wave at the ends so it kisses the endpoints
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
            strokeWidth={stroke}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="rhei-arrow"
            style={{
              animationDelay: `${delay}s`,
              filter: `drop-shadow(0 0 ${stroke*4} ${color}66)`,
            }}/>
    );
  }

  return null;
}

export default function AnimatedRitualStep({ ritualId, stepIndex, size = 280, showFrame = true }) {
  const ritual = RITUALS[ritualId];
  // Fallback: if this ritual has no animated config, render nothing here;
  // the parent should pass through to the legacy illustration component.
  if (!ritual) return null;
  const step = ritual.steps[stepIndex - 1];
  if (!step) return null;
  const woman = ritual.woman;
  const landmarks = LANDMARKS[woman];

  return (
    <div style={{
      position: "relative",
      width: size,
      height: size * 1.25,
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
          display: "block",
        }}
      />
      <svg
        viewBox="0 0 1 1.25"
        preserveAspectRatio="none"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* SVG uses normalized coords [0..1] in x and [0..1.25] in y to match photo aspect */}
        <g transform="scale(1, 1.25)">
          {step.gestures.map((g, i) => (
            <Gesture key={i} gesture={g} landmarks={landmarks} index={i}/>
          ))}
        </g>
      </svg>
      {showFrame && (
        <div style={{
          position: "absolute", inset: 0,
          pointerEvents: "none",
          fontFamily: "'IBM Plex Mono', 'Geist Mono', monospace",
          color: "rgba(242, 235, 220, 0.85)",
        }}>
          {/* Corner brackets */}
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
          {/* Top label */}
          <span style={{
            position: "absolute", top: 10, left: 28,
            fontSize: 8, letterSpacing: "0.18em",
            color: "rgba(242,235,220,0.7)",
          }}>{ritual.label}</span>
          <span style={{
            position: "absolute", top: 10, right: 28,
            fontSize: 8, letterSpacing: "0.18em",
            color: "rgba(242,235,220,0.45)",
          }}>RHEI · STEP</span>
          {/* Bottom label */}
          <span style={{
            position: "absolute", bottom: 10, left: 28,
            fontSize: 8, letterSpacing: "0.18em",
            color: "#E4C48A",
          }}>{step.step}</span>
          {step.note && (
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

// Export a check so callers can decide whether to use this component
// or fall back to the legacy diagram.
export function hasAnimatedSteps(ritualId) {
  return Boolean(RITUALS[ritualId]);
}
