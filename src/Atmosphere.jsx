// ════════════════════════════════════════════════════════════
// RHEI — Editorial primitives
// Aesop / Open / Apple grammar. Near-monochrome. Photo-led. Restrained.
// No saturated gold, no fairy-dust, no theatrical light shafts.
// One warm light source. Deep shadows. Editorial typography.
// ════════════════════════════════════════════════════════════

/**
 * EditorialAmbient — a single restrained light wash from the top.
 * Replaces the previous DramaticGodRays. No diagonal shafts, no motes.
 * Just a soft warm bias against deep espresso, like a museum gallery.
 *
 * Props:
 *   tone       — "warm" | "cool" | "neutral"  (default "warm")
 *   intensity  — 0..1, default 0.55. Lower than before. Restraint.
 *   pierce     — x-position of the implied light source. default "70%"
 *   floor      — bool, optional warm spill at bottom (default false)
 */
export function EditorialAmbient({
  tone = "warm",
  intensity = 0.55,
  pierce = "70%",
  floor = false,
}) {
  // Palette per tone — kept dim, editorial, never saturated
  const palettes = {
    warm:    { core: "232, 196, 152", edge: "180, 140, 90"  },
    cool:    { core: "210, 220, 230", edge: "140, 160, 180" },
    neutral: { core: "230, 222, 210", edge: "175, 165, 150" },
  };
  const p = palettes[tone] || palettes.warm;

  return (
    <>
      {/* Single soft wash from the implied light source — that's it. */}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse 85% 55% at ${pierce} -8%, rgba(${p.core},${0.28*intensity}) 0%, rgba(${p.core},${0.14*intensity}) 22%, rgba(${p.edge},${0.06*intensity}) 45%, transparent 70%)`,
        pointerEvents:"none",
      }}/>

      {/* Optional floor spill — for screens that need a base anchor */}
      {floor && (
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"32%",
          background:`linear-gradient(180deg, transparent 0%, rgba(${p.edge},${0.04*intensity}) 60%, rgba(${p.edge},${0.07*intensity}) 100%)`,
          pointerEvents:"none",
        }}/>
      )}

      {/* Restrained side vignette — like a photograph's edge falloff */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 95% 110% at 50% 50%, transparent 55%, rgba(0,0,0,0.32) 90%, rgba(0,0,0,0.55) 100%)",
      }}/>

      {/* Minimal grain — film, not glitter */}
      <div className="rhei-grain"/>
    </>
  );
}

/**
 * Backwards compatibility — old DramaticGodRays calls become a quieter ambient.
 */
export function DramaticGodRays(props) {
  return <EditorialAmbient tone="warm" intensity={0.55} pierce="60%" floor={true} />;
}

/**
 * RheiMark — the new typographic mark.
 * Wordmark set in tight Fraunces, with a hairline above. Apple/Aesop confidence,
 * not a starburst sticker. Use this everywhere the old Starburst sat.
 */
export function RheiMark({ size = 28, color = "#F2EBDC", showLine = true }) {
  return (
    <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      {showLine && <div style={{ width:24, height:1, background:color, opacity:0.5 }}/>}
      <span style={{
        fontFamily:"'Fraunces', Georgia, 'Times New Roman', serif",
        fontSize:size,
        fontWeight:300,
        color,
        letterSpacing:"0.36em",
        textIndent:"0.36em",
        textTransform:"uppercase",
        lineHeight:1,
        fontVariationSettings:"'opsz' 72",
      }}>RHEI</span>
    </div>
  );
}

/**
 * Legacy alias for StarburstPlinth — now just renders the RheiMark.
 * Keeps the old screen code working until we sweep through.
 */
export function StarburstPlinth({ size, glyph }) {
  return <RheiMark size={20} />;
}
export function Starburst({ size = 28 }) {
  return <RheiMark size={size * 0.7} showLine={false} />;
}

/**
 * CornerBrackets — kept, but with restraint. Default opacity lower, thinner.
 * Used sparingly on heroes — not on every card.
 */
export function CornerBrackets({ inset = 12, size = 14, color = "rgba(242,235,220,0.30)", thickness = 1 }) {
  const arm = { position:"absolute", background:color };
  return (
    <>
      <div style={{...arm, top:inset, left:inset, width:size, height:thickness}}/>
      <div style={{...arm, top:inset, left:inset, width:thickness, height:size}}/>
      <div style={{...arm, top:inset, right:inset, width:size, height:thickness}}/>
      <div style={{...arm, top:inset, right:inset, width:thickness, height:size}}/>
      <div style={{...arm, bottom:inset, left:inset, width:size, height:thickness}}/>
      <div style={{...arm, bottom:inset, left:inset, width:thickness, height:size}}/>
      <div style={{...arm, bottom:inset, right:inset, width:size, height:thickness}}/>
      <div style={{...arm, bottom:inset, right:inset, width:thickness, height:size}}/>
    </>
  );
}

/**
 * PrecisionStamp — tightened. Neutral cream color by default. Less gold.
 */
export function PrecisionStamp({ label, value, color = "rgba(242,235,220,0.55)" }) {
  return (
    <span style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize: 9, fontWeight: 500, letterSpacing: "0.36em",
      textTransform: "uppercase", color,
      fontVariantNumeric: "tabular-nums",
      display: "inline-flex", alignItems: "center", gap: 8,
    }}>
      <span style={{opacity:0.75}}>{label}</span>
      {value !== undefined && (
        <>
          <span style={{width:8, height:1, background:color, opacity:0.35}}/>
          <span>{value}</span>
        </>
      )}
    </span>
  );
}

/**
 * Hairline — neutral cream by default. Gold is no longer the default tint.
 */
export function Hairline({ width = "100%", color = "rgba(242,235,220,0.14)", margin = "0" }) {
  return (
    <div style={{
      width, height: 1, margin,
      background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
    }}/>
  );
}

/**
 * EditorialPhoto — a full-bleed editorial photograph slot.
 * Falls back to a refined CSS composition when no image is provided,
 * so the layout looks intentional even before real photography is loaded.
 *
 * Props:
 *   src       — image path. If absent, renders a styled fallback composition.
 *   aspect    — CSS aspect-ratio string. Default "4 / 5" (editorial portrait).
 *   tone      — fallback composition style: "skin" | "stone" | "water" | "linen"
 *   overlay   — bool. If true, applies a dark gradient overlay for text legibility.
 *   children  — overlay content (title block, etc.)
 */
export function EditorialPhoto({
  src,
  aspect = "4 / 5",
  tone = "skin",
  overlay = true,
  children,
  style = {},
}) {
  // Fallback compositions — refined CSS-only "photographs" until real images exist
  const fallbacks = {
    skin: `
      radial-gradient(ellipse 60% 40% at 60% 35%, rgba(232,196,150,0.55) 0%, rgba(180,128,82,0.30) 35%, rgba(45,28,18,0.85) 75%, #0E0807 100%),
      radial-gradient(ellipse 100% 80% at 30% 80%, rgba(120,78,48,0.35) 0%, transparent 55%)
    `,
    stone: `
      linear-gradient(155deg, #14100C 0%, #221A14 35%, #2D2218 60%, #1A130E 100%),
      radial-gradient(ellipse 70% 50% at 70% 25%, rgba(220,200,170,0.18) 0%, transparent 60%)
    `,
    water: `
      linear-gradient(170deg, #0A0F12 0%, #131C20 40%, #1E2A2D 70%, #0E1316 100%),
      radial-gradient(ellipse 80% 30% at 50% 20%, rgba(200,210,200,0.20) 0%, transparent 55%)
    `,
    linen: `
      linear-gradient(160deg, #1A130C 0%, #261B12 40%, #2E2218 60%, #181107 100%),
      radial-gradient(ellipse 60% 35% at 35% 25%, rgba(232,210,178,0.22) 0%, transparent 55%)
    `,
  };

  const fallbackBg = fallbacks[tone] || fallbacks.skin;
  // Stack the photo over the fallback composition. If the photo URL 404s,
  // the gradient fallback still renders, so the layout never looks broken.
  const overlayGrad = overlay
    ? "linear-gradient(180deg, rgba(8,5,3,0.0) 0%, rgba(8,5,3,0.05) 35%, rgba(8,5,3,0.55) 75%, rgba(8,5,3,0.92) 100%)"
    : null;
  const bg = src
    ? [overlayGrad, `url('${src}')`, fallbackBg].filter(Boolean).join(", ")
    : `${overlay ? "linear-gradient(180deg, rgba(8,5,3,0.0) 0%, rgba(8,5,3,0.05) 35%, rgba(8,5,3,0.45) 75%, rgba(8,5,3,0.85) 100%), " : ""}${fallbackBg}`;

  return (
    <div style={{
      position:"relative",
      aspectRatio: aspect,
      width:"100%",
      background: bg,
      backgroundSize:"cover",
      backgroundPosition:"center",
      backgroundRepeat:"no-repeat",
      overflow:"hidden",
      ...style,
    }}>
      {/* Subtle film grain on photographs */}
      <div style={{ position:"absolute", inset:0, opacity:0.5, pointerEvents:"none" }} className="rhei-grain"/>
      {children}
    </div>
  );
}

/**
 * PhotoStrip — a thin horizontal strip of photography (or fallback texture)
 * used as a visual rest between sections, like a magazine column rule.
 */
export function PhotoStrip({ src, tone = "skin", height = 120 }) {
  return (
    <EditorialPhoto
      src={src}
      tone={tone}
      aspect="auto"
      overlay={false}
      style={{ height, aspectRatio: "auto" }}
    />
  );
}

/**
 * ScanLine — kept for technical accents.
 */
export function ScanLine({ opacity = 0.04 }) {
  return (
    <div style={{
      position:"absolute", inset:0, pointerEvents:"none",
      backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(242,235,220,${opacity}) 3px, rgba(242,235,220,${opacity}) 4px)`,
      mixBlendMode:"overlay",
    }}/>
  );
}

// ── Shared neutral palette tokens — Aesop/Apple/Open grammar ──
// Near-monochrome. Saturated gold is now a small accent, not a temperature.
export const RHEI_BASE = "#0C0907";              // deepest ink — base canvas
export const RHEI_PAPER = "#F2EBDC";              // warm paper-white — primary text on dark
export const RHEI_SAND = "#D4C8B0";               // muted sand — secondary text
export const RHEI_STONE = "#8E8170";              // stone — tertiary text
export const RHEI_BONE = "#1A1410";               // bone-on-dark — card bg
export const RHEI_ACCENT = "#C9A472";             // restrained accent — used sparingly
export const RHEI_HAIRLINE = "rgba(242,235,220,0.14)";
export const RHEI_DARK_BASE = "linear-gradient(180deg, #0C0907 0%, #100B08 50%, #0C0907 100%)";

// Legacy exports (some old code references these)
export const RHEI_VELLUM = RHEI_PAPER;
export const RHEI_ACCENT_WARM = RHEI_ACCENT;
export const RHEI_F = "'Fraunces', Georgia, 'Times New Roman', serif";
export const RHEI_SF = "'Inter', system-ui, -apple-system, sans-serif";
