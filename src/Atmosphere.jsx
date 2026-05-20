// ════════════════════════════════════════════════════════════
// RHEI — Shared cinematic atmosphere primitives
// Used across Meditations, Rituals, Affirmations, Journey, Premium
// to give every screen the same Luminar god-rays signature.
// ════════════════════════════════════════════════════════════

/**
 * DramaticGodRays — theatrical diagonal shafts streaming from a pierce point
 * just above the frame. Sits absolute-positioned over a dark gradient parent.
 *
 * Props:
 *   intensity — 0..1.2, default 1. Scales every layer's opacity together.
 *   pierce    — CSS x-position of the "sun above the frame" (e.g. "50%", "30%").
 *   vignette  — bool, default true. Side-vignette that pulls eye to center.
 *   floor     — bool, default true. Warm spill at the bottom of the frame.
 *   motes     — bool, default true. Drifting dust in the beams.
 */
export function DramaticGodRays({
  intensity = 1,
  pierce = "50%",
  vignette = true,
  floor = true,
  motes = true,
}) {
  return (
    <>
      {/* Top ambient wash — pulls eye upward */}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse 120% 70% at ${pierce} -10%, rgba(245,200,120,${0.42*intensity}) 0%, rgba(232,170,90,${0.22*intensity}) 18%, rgba(180,120,50,${0.10*intensity}) 38%, transparent 62%)`,
        pointerEvents:"none",
      }}/>

      {/* The pierce — concentrated hot core just above frame */}
      <div style={{
        position:"absolute", top:"-8%", left:pierce,
        width:"60vmin", height:"60vmin", borderRadius:"50%",
        background:`radial-gradient(circle, rgba(255,220,150,${0.65*intensity}) 0%, rgba(245,200,120,${0.40*intensity}) 18%, rgba(220,160,80,${0.18*intensity}) 38%, transparent 62%)`,
        filter:"blur(28px)",
        transform:"translateX(-50%)",
        animation:"rhei-ember 18s ease-in-out infinite",
        mixBlendMode:"screen", pointerEvents:"none",
      }}/>

      {/* Streaming diagonal shafts — 5 angles, varied width */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none", mixBlendMode:"screen",
        background:`
          linear-gradient(165deg, transparent 30%, rgba(255,220,150,${0.18*intensity}) 44%, rgba(245,200,120,${0.10*intensity}) 50%, transparent 64%),
          linear-gradient(178deg, transparent 28%, rgba(255,210,130,${0.14*intensity}) 42%, transparent 60%),
          linear-gradient(195deg, transparent 32%, rgba(245,200,120,${0.16*intensity}) 46%, rgba(220,160,80,${0.08*intensity}) 54%, transparent 68%),
          linear-gradient(212deg, transparent 30%, rgba(232,170,90,${0.12*intensity}) 44%, transparent 60%),
          linear-gradient(155deg, transparent 36%, rgba(255,220,150,${0.10*intensity}) 48%, transparent 60%)
        `,
        filter:"blur(2px)",
      }}/>

      {/* Soft outer shafts — peripheral, lowest opacity */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none", mixBlendMode:"screen",
        background:`
          linear-gradient(140deg, transparent 25%, rgba(245,200,120,${0.07*intensity}) 50%, transparent 75%),
          linear-gradient(225deg, transparent 25%, rgba(220,160,80,${0.06*intensity}) 50%, transparent 75%)
        `,
        filter:"blur(8px)",
      }}/>

      {floor && (
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"42%",
          background:`linear-gradient(180deg, transparent 0%, rgba(180,120,50,${0.06*intensity}) 60%, rgba(120,80,30,${0.10*intensity}) 100%)`,
          pointerEvents:"none", mixBlendMode:"screen",
        }}/>
      )}

      {motes && (
        <div style={{position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden"}}>
          {Array.from({length: 9}).map((_, i) => (
            <span key={i} style={{
              position:"absolute",
              left: `${15 + (i * 9.5) % 70}%`,
              top: `${(i * 11.3 + 12) % 70}%`,
              width: 2 + (i%3), height: 2 + (i%3),
              borderRadius:"50%",
              background: i%2 ? `rgba(255,220,150,${0.55*intensity})` : `rgba(245,200,120,${0.42*intensity})`,
              filter:"blur(1.2px)",
              animation: `rhei-drift-${i%3} ${28 + (i%4)*4}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}/>
          ))}
        </div>
      )}

      {vignette && (
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse 70% 100% at 50% 50%, transparent 30%, rgba(8,5,2,0.40) 75%, rgba(8,5,2,0.85) 100%)",
        }}/>
      )}

      <div className="rhei-grain"/>
    </>
  );
}

/**
 * Starburst — minimal RHEI mark, asterisk-glyph in gold over a dark plinth.
 * The signature icon at the top of every primary screen.
 */
export function Starburst({ size = 28, color = "#F5C878" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2 L17.2 13.4 L28 14.8 L17.2 16.6 L16 30 L14.8 16.6 L4 14.8 L14.8 13.4 Z" fill={color} opacity="0.95"/>
      <path d="M16 6 L16.6 13.8 L24 14.8 L16.6 15.8 L16 26 L15.4 15.8 L8 14.8 L15.4 13.8 Z" fill="#FFE4B0" opacity="0.7"/>
    </svg>
  );
}

/**
 * StarburstPlinth — the framed badge that holds the Starburst at the hero.
 * Centered light-card with a soft inner+outer glow.
 */
export function StarburstPlinth({ size = 46, glyph = 26 }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:size, height:size, borderRadius:10,
      background:"rgba(8,5,2,0.55)",
      border:"1px solid rgba(245,200,120,0.18)",
      boxShadow:"0 0 40px rgba(245,200,120,0.30), inset 0 0 20px rgba(245,200,120,0.10)",
    }}>
      <Starburst size={glyph} />
    </div>
  );
}

/**
 * CornerBrackets — four hairline L-marks that frame a hero like an observatory
 * crosshair or a luxury watch dial. Tech-luxe accent.
 */
export function CornerBrackets({ inset = 12, size = 14, color = "rgba(245,200,120,0.45)", thickness = 1 }) {
  const arm = { position:"absolute", background:color };
  return (
    <>
      {/* TL */}
      <div style={{...arm, top:inset, left:inset, width:size, height:thickness}}/>
      <div style={{...arm, top:inset, left:inset, width:thickness, height:size}}/>
      {/* TR */}
      <div style={{...arm, top:inset, right:inset, width:size, height:thickness}}/>
      <div style={{...arm, top:inset, right:inset, width:thickness, height:size}}/>
      {/* BL */}
      <div style={{...arm, bottom:inset, left:inset, width:size, height:thickness}}/>
      <div style={{...arm, bottom:inset, left:inset, width:thickness, height:size}}/>
      {/* BR */}
      <div style={{...arm, bottom:inset, right:inset, width:size, height:thickness}}/>
      <div style={{...arm, bottom:inset, right:inset, width:thickness, height:size}}/>
    </>
  );
}

/**
 * PrecisionStamp — small mono-feel readout, e.g. "RHEI · 01" or "0.30 / 1.00".
 * Used as a tech-luxe corner detail.
 */
export function PrecisionStamp({ label, value, color = "rgba(248,242,229,0.55)" }) {
  return (
    <span style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize: 9, fontWeight: 500, letterSpacing: "0.32em",
      textTransform: "uppercase", color,
      fontVariantNumeric: "tabular-nums",
      display: "inline-flex", alignItems: "center", gap: 8,
    }}>
      <span style={{opacity:0.7}}>{label}</span>
      {value !== undefined && (
        <>
          <span style={{width:8, height:1, background:color, opacity:0.4}}/>
          <span>{value}</span>
        </>
      )}
    </span>
  );
}

/**
 * Hairline — a 1px gold-tinted divider with a subtle gradient fade at the ends.
 */
export function Hairline({ width = "100%", color = "rgba(245,200,120,0.22)", margin = "0" }) {
  return (
    <div style={{
      width, height: 1, margin,
      background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
    }}/>
  );
}

/**
 * ScanLine — extremely subtle horizontal scan effect over the hero.
 * Looks like an analog film line, not a digital glitch.
 */
export function ScanLine({ opacity = 0.04 }) {
  return (
    <div style={{
      position:"absolute", inset:0, pointerEvents:"none",
      backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(248,242,229,${opacity}) 3px, rgba(248,242,229,${opacity}) 4px)`,
      mixBlendMode:"overlay",
    }}/>
  );
}

// Shared design constants used across screens
export const RHEI_DARK_BASE = "linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)";
export const RHEI_VELLUM = "#F8F2E5";
export const RHEI_ACCENT_WARM = "#F5C878";
export const RHEI_F = "'Fraunces', Georgia, 'Times New Roman', serif";
export const RHEI_SF = "'Inter', system-ui, -apple-system, sans-serif";
