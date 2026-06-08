import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronLeft, Moon, Sun, Wind, Shield, Home, Headphones, BarChart3, Heart, Clock, Check, Flame, X, ArrowRight, Brain, Activity, Zap, Sunset, Timer, Waves, RefreshCw, Sparkles, Lock, Crown, User, Hand, Mail, LogOut, MessageCircle, Camera, Volume2, VolumeX, Eye, EyeOff, Bell } from "lucide-react";
import { supabase, supabaseEnabled } from "./supabaseClient";
import { pushSupported, notificationPermission, currentSubscription, subscribeToPush, unsubscribeFromPush } from "./pushClient";
import FaceGuideIllustration from "./FaceGuideIllustration";
import BellyGuideIllustration from "./BellyGuideIllustration";

// Rituals whose guidance art is the torso/abdomen, not the face.
// Add new body rituals here so the renderer auto-picks the right illustration.
const BELLY_RITUALS = new Set(["belly-flow"]);

// Pick the right illustration for a ritual + zone.
function RitualIllustration({ ritualId, zone, size }) {
  if (BELLY_RITUALS.has(ritualId)) {
    return <BellyGuideIllustration zone={zone || "full"} size={size} />;
  }
  return <FaceGuideIllustration zone={zone || "full"} size={size} />;
}

// RitualStepImage — animated real-portrait + gold gesture overlay for each
// ritual step. Delegates to AnimatedRitualStep for face rituals (which renders
// live animated SVG over the woman's portrait). Falls back to the legacy
// diagrammatic illustration for any ritual without an animated config yet
// (currently: belly-flow, awaiting source photography).
function RitualStepImage({ ritualId, stepIndex = 1, zone, size = 280, width, height, radius = 14, shadow = true, showFrame = true, showGestures = true }) {
  if (!hasAnimatedSteps(ritualId)) {
    // Fallback (currently belly-flow, awaiting source photography).
    // Wrap the legacy SVG diagram in an editorial frame so it lives in the
    // same visual family as the photo rituals — same brown ground, same
    // corner brackets, same proportions — rather than appearing as a bare
    // line drawing.
    const w = width != null ? width : size;
    const h = height != null ? height : size * 1.25;
    return (
      <div
        key={`${ritualId}-${stepIndex}`}
        className="rhei-step-enter"
        style={{
          position: "relative",
          width: w,
          height: h,
          borderRadius: 14,
          overflow: "hidden",
          background: "radial-gradient(ellipse at 50% 38%, rgba(196,154,75,0.16) 0%, rgba(58,37,22,0.55) 45%, #2D1B0E 100%)",
        }}>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ transform:"scale(1.15)", opacity:0.9 }}>
            <RitualIllustration ritualId={ritualId} zone={zone} size={Math.min(w, h) * 0.65} />
          </div>
        </div>
        {showFrame && (
          <>
            {[
              { top: 8, left: 8 },
              { top: 8, right: 8 },
              { bottom: 8, left: 8 },
              { bottom: 8, right: 8 },
            ].map((pos, i) => (
              <div key={i} style={{
                position: "absolute", ...pos,
                width: 12, height: 12,
                borderTop: "1px solid rgba(242,235,220,0.45)",
                borderLeft: "1px solid rgba(242,235,220,0.45)",
                transform: i === 1 ? "rotate(90deg)" : i === 2 ? "rotate(-90deg)" : i === 3 ? "rotate(180deg)" : "none",
                transformOrigin: "top left",
              }}/>
            ))}
          </>
        )}
      </div>
    );
  }
  return (
    <AnimatedRitualStep
      ritualId={ritualId}
      stepIndex={stepIndex}
      size={size}
      width={width}
      height={height}
      showFrame={showFrame}
      showGestures={showGestures}
    />
  );
}
import AffirmationsScreen from "./AffirmationsScreen";
import FaceMirrorMode from "./FaceMirrorMode";
import AnimatedRitualStep, { hasAnimatedSteps } from "./AnimatedRitualStep";
import RitualMirrorView from "./RitualMirrorView";
import { CornerBrackets, PrecisionStamp, Hairline, StarburstPlinth as SharedStarburstPlinth, RheiMark, EditorialPhoto, EditorialAmbient } from "./Atmosphere";

/* ═══════════════════════════════════════════
   RHEI — Your face is where your nervous system shows.
   v3.0 — Face-first. Everything else follows.
   ═══════════════════════════════════════════ */

// ═══════════════════════════════════════════
//  DESIGN TOKENS — see RHEI_Design_System.md for the brand bible
// ═══════════════════════════════════════════
const B = {
  // ── Dark surfaces (Obsidian → Suede) ──
  obsidian: "#0F0905",
  espresso: "#1A0F06",   // primary dark
  walnut:   "#241509",
  cocoa:    "#2D1B0E",
  bark:     "#3A2516",
  suede:    "#4A3120",

  // ── Champagne / metallics — the brand's "light source" within the night ──
  antique:    "#A07D3A",
  champagne:  "#C49A4B",   // primary brand gold
  polished:   "#D4AD6A",   // hover / lustre
  vellumGold: "#E8D2A4",
  amberGlow:  "#E8C088",   // warm bloom hue (radial gradient cores)
  honeyDeep:  "#B88940",   // deeper honey for layered glow
  emberCore:  "#F5D89A",   // brightest spot in a sun-bloom radial

  // ── Creams / paper ──
  vellum:   "#F8F2E5",
  paper:    "#F2E8D9",   // primary cream
  eggshell: "#E2D3B9",
  linen:    "#C9B99F",

  // ── Accents ──
  smoke: "#8A7560",
  sage:  "#7A8674",
  rouge: "#C4786A",
  ash:   "#5C4B3A",

  // ── Glass / hairlines ──
  glassThin:   "rgba(248,242,229,0.04)",
  glassMed:    "rgba(248,242,229,0.06)",
  glassDeep:   "rgba(248,242,229,0.08)",
  hairline:    "rgba(248,242,229,0.08)",
  hairlineGold:"rgba(196,154,75,0.18)",

  // ── Gradients & shadows ──
  goldGrad:  "linear-gradient(135deg, #C49A4B 0%, #D4AD6A 50%, #A07D3A 100%)",
  darkGrad:  "linear-gradient(180deg, #241509 0%, #0F0905 100%)",
  warmShadow:    "0 24px 60px -20px rgba(15,9,5,0.7), 0 8px 20px rgba(15,9,5,0.4)",
  warmShadowSm:  "0 12px 32px -8px rgba(15,9,5,0.55), 0 4px 12px rgba(15,9,5,0.3)",
  goldGlow:      "0 6px 32px rgba(196,154,75,0.22)",
  goldGlowSm:    "0 4px 18px rgba(196,154,75,0.18)",

  // ── Motion ──
  ease:        "cubic-bezier(0.22, 0.61, 0.36, 1)",
  easeEnter:   "cubic-bezier(0.16, 1, 0.3, 1)",
  easeIn:      "cubic-bezier(0.7, 0, 0.84, 0)",

  // ── Legacy aliases (kept so the rest of the app still compiles; will deprecate
  //     as screens are redesigned). Map old names → new tokens.
  bg: "#2D1B0E", bgDeep: "#1A0F06", bgMid: "#241509",
  card: "#3A2516", cardHover: "#4A3120", cardHigh: "#4A3120", cardElevated: "#4A3120",
  gold: "#C49A4B", goldLight: "#D4AD6A", goldMuted: "#A07D3A", goldBright: "#D4AD6A",
  goldDim: "rgba(196,154,75,0.4)", goldGradSimple: "linear-gradient(135deg, #C49A4B 0%, #D4AD6A 50%, #C49A4B 100%)",
  cream: "#F2E8D9", creamMuted: "#C9B99F", muted: "#8A7560",
  white: "#FFFAF3", warmBlack: "#1A0F06",
  border: "rgba(196,154,75,0.12)", borderSoft: "rgba(196,154,75,0.18)", borderActive: "rgba(196,154,75,0.3)",
  cardShadow: "0 2px 12px rgba(26,15,6,0.4)",
};
const F  = "'Fraunces', Georgia, 'Times New Roman', serif";
const SF = "'Inter', system-ui, -apple-system, sans-serif";

const GLOBAL_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .rhei-page { animation: fadeUp 0.35s ease both; }
  ::-webkit-scrollbar { display: none; }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
`;

// ── Nervous System Resets ──
const sessions = [
  { id:1, title:"The Morning Reset", subtitle:"Before the day begins", duration:179, icon:Sun,     accent:"#C4A487", description:"Sets your nervous system baseline before anything else can. Three minutes of breathing — extended exhale, somatic grounding, vagal activation. Best done before your phone.",                                                technique:"Extended exhale · Somatic grounding · Vagal humming",            bestFor:"First minutes after waking",                              timeOfDay:"morning", audioFile:"/audio/morning-reset.mp3",       occasion:"morning"  },
  { id:2, title:"Before the Room", subtitle:"Composure before you walk in",       duration:200, icon:Shield,  accent:"#BFA078", description:"Activates vagal tone and grounds the nervous system before high-stakes moments. The difference between responding and reacting.",                                                                                  technique:"Physiological sigh · Somatic grounding · Cognitive anchor",     bestFor:"Five minutes before any demanding interaction",          timeOfDay:"any",     audioFile:"/audio/pre-meeting-reset.mp3",   occasion:"event"    },
  { id:3, title:"Coming Home",     subtitle:"From the day, back to you",                  duration:234, icon:Sunset,  accent:"#B49170", description:"Releases the activation that lingers after a workday. Designed for the shift between professional and personal life — so you don't bring it home.",                                                              technique:"Progressive release · Body scan · Identity shift",              bestFor:"The commute home, or before walking through the door",   timeOfDay:"evening", audioFile:"/audio/transition-reset.mp3",    occasion:"evening"  },
  { id:4, title:"After Words",      subtitle:"Put down what you're still holding",           duration:194, icon:Wind,    accent:"#B08775", description:"After a difficult conversation, the body stays physiologically activated long after the moment ends. This is how you actually leave it.",                                                                          technique:"Bilateral stimulation · Physiological sigh · Self-compassion",  bestFor:"After difficult conversations or anything emotionally costly", timeOfDay:"any", audioFile:"/audio/post-conflict-reset.mp3", occasion:"recovery" },
  { id:5, title:"Return to Self",  subtitle:"Wherever you are",                              duration:172, icon:RefreshCw,accent:"#A8916C", description:"The foundational reset. No specific trigger required — use it whenever you've drifted or tensed. Three minutes, anywhere.",                                                                                       technique:"Diaphragmatic breathing · Body awareness · Vagal activation",   bestFor:"Any moment you need to come back to center",             timeOfDay:"any",     audioFile:"/audio/general-reset.mp3",       occasion:"any"      },
];

// ── Face states — drives ritual + meditation recommendations ──
// ── Editorial mood pathway ──
// Each state names an emotional posture, not a symptom. Mapped to existing
// rituals + meditations so the adaptive engine keeps working. The `dominant`
// key is preserved so generateAdaptiveRitual continues to re-order step zones.
const nsStates = [
  { id:"overstimulated",   label:"Overstimulated",    sublabel:"Too much input. Every window open.",       icon:Zap,     color:"#C4786A", dominant:"tight",   ritualId:"buccal",     meditationId:4, message:"You've been holding too much input. Let's quiet the signal." },
  { id:"depleted",         label:"Depleted",          sublabel:"Running on empty. Gentle effort only.",    icon:Moon,    color:"#8A9BAF", dominant:"puffy",   ritualId:"lymphatic",  meditationId:3, message:"You've given enough this week. Receive instead." },
  { id:"puffy",            label:"Puffy",             sublabel:"The body is holding water.",               icon:Waves,   color:"#7A8B99", dominant:"puffy",   ritualId:"lymphatic",  meditationId:3, message:"There's fluid to move today. Long, slow strokes." },
  { id:"holding-tension",  label:"Holding tension",   sublabel:"Jaw, neck, brow — locked in.",             icon:Shield,  color:"#A07D3A", dominant:"tight",   ritualId:"buccal",     meditationId:4, message:"You've been bracing. Let's release what's been doing all the work." },
  { id:"restless",         label:"Restless",          sublabel:"The mind is moving faster than the body.", icon:Wind,    color:"#A08BAA", dominant:"general", ritualId:"face-lift",  meditationId:5, message:"Settle first. Everything else after." },
  { id:"seeking-calm",     label:"Seeking calm",      sublabel:"You already know what you need.",          icon:Sunset,  color:"#7A8674", dominant:"general", ritualId:"gua-sha",    meditationId:5, message:"Welcome back to yourself." },
  { id:"needing-grounding",label:"Needing grounding", sublabel:"Floating slightly above your body.",       icon:Brain,   color:"#8A9BAF", dominant:"tired",   ritualId:"eye-revival",meditationId:1, message:"Come back to the floor. Everything else can wait." },
  { id:"wanting-softness", label:"Wanting softness",  sublabel:"Not a problem to solve. Just permission.", icon:Heart,   color:"#C49A4B", dominant:"flat",    ritualId:"belly-flow", meditationId:3, message:"You don't need a reason. Soften because you can." },
];

// ── Quiet Relief — micro-intervention copy ──
// Editorial first, technical second. The 'secondary' line stays in the UI but
// reads as a subtitle, not a feature description.
const microInterventions = [
  { id:"sigh",   title:"Soft Reset",        secondary:"Physiological sigh",  badge:"60 sec", desc:"The fastest way back to baseline." },
  { id:"jaw",    title:"Release the Jaw",   secondary:"Vagus activation",    badge:"40 sec", desc:"Where most of us hold the day." },
  { id:"ground", title:"Find the Floor",    secondary:"Sensory grounding",   badge:"90 sec", desc:"Five things, then four, then three." },
  { id:"tap",    title:"Bilateral Soothe",  secondary:"Butterfly tap",       badge:"30 sec", desc:"Cross-body. Alternating. Slow." },
];

// ── Editorial Collections ──
// Curated groupings of existing rituals by occasion / lifestyle moment.
// Drives the "Curated" carousel on the Home screen and (next session) the
// Rituals library editorial browser.
const collections = [
  { id:"morning-sculpt",       title:"Morning Sculpt",         subtitle:"The face you bring into the day",                  ritualIds:["gua-sha","face-lift"],          accent:"#BFA078" },
  { id:"hotel-reset",          title:"Hotel Reset",            subtitle:"Long flight, foreign bathroom, full presence in an hour", ritualIds:["lymphatic","eye-revival"], accent:"#8E9BA0" },
  { id:"before-dinner",        title:"Before Dinner",          subtitle:"The half hour between the day and the table",      ritualIds:["pre-event","gua-sha"],          accent:"#BFA078" },
  { id:"post-flight",          title:"Post-Flight Drainage",   subtitle:"When the body forgot what time zone it's in",      ritualIds:["lymphatic","belly-flow"],       accent:"#82908B" },
  { id:"evening-softening",    title:"Evening Softening",      subtitle:"Putting the day down before bed",                  ritualIds:["buccal","belly-flow"],          accent:"#998BA0" },
  { id:"pre-event-glow",       title:"Pre-Event Glow",         subtitle:"For the room you're about to walk into",           ritualIds:["pre-event","face-lift"],        accent:"#BFA078" },
  { id:"jaw-release",          title:"Jaw Release",            subtitle:"For the day that asked too much",                  ritualIds:["buccal"],                       accent:"#9C8868" },
  { id:"sunday-restoration",   title:"Sunday Restoration",     subtitle:"A longer practice for when there's time",          ritualIds:["belly-flow","lymphatic","gua-sha"], accent:"#7E8479" },
  { id:"emotional-decompress", title:"Emotional Decompression",subtitle:"For after the hard conversation",                  ritualIds:["buccal","eye-revival"],         accent:"#B08775" },
];

// ── Adaptive ritual generator — re-orders steps by face state ──
const generateAdaptiveRitual = (ritual, faceState) => {
  if (!ritual) return ritual;
  if (!faceState) return ritual;
  const dominant = faceState.dominant;
  let steps = [...ritual.steps];
  // Re-order: priority zones first based on dominant state
  const priorityZones = {
    puffy:   ["nodes","neck","undereye","orbital","cheeks"],
    tight:   ["jawline","temples","full","marionette"],
    flat:    ["cheeks","brow","forehead","nasolabial"],
    tired:   ["undereye","orbital","brow","nodes"],
    general: [],
  };
  const priority = priorityZones[dominant] || [];
  if (priority.length > 0) {
    const first = steps.filter(s => priority.includes(s.zone));
    const rest  = steps.filter(s => !priority.includes(s.zone));
    // Keep warm-up first if it exists
    const warmup = rest.find(s => s.zone === "full" && steps.indexOf(s) === 0);
    if (warmup) {
      steps = [warmup, ...first, ...rest.filter(s=>s!==warmup)];
    } else {
      steps = [...first, ...rest];
    }
  }
  // Slight duration variation (+/- 8%) so sessions never feel identical
  const seed = Date.now() % 100;
  const varied = steps.map((step, i) => ({
    ...step,
    duration: Math.round(step.duration * (0.93 + ((seed + i * 17) % 15) / 100)),
  }));
  return { ...ritual, steps: varied };
};

// ── Meditation check-in → maps to audio reset ──
const meditationStates = [
  { id:"wired",    label:"Wired / Tense",     sublabel:"Can't slow down, mind racing",           icon:Zap,      color:"#C4786A", sessionId:2 },
  { id:"flat",     label:"Low / Drained",     sublabel:"Low energy, going through the motions",  icon:Brain,    color:"#8A9BAF", sessionId:1 },
  { id:"stressed", label:"Stressed / Reactive",sublabel:"Overwhelmed or easily triggered",        icon:Activity, color:"#A08BAA", sessionId:4 },
  { id:"tired",    label:"Tired / Depleted",  sublabel:"Exhausted but can't rest",               icon:Moon,     color:"#7A8B99", sessionId:3 },
  { id:"okay",     label:"Just need to centre",sublabel:"Fine — want to check in and reset",       icon:Waves,    color:"#8BAA8B", sessionId:5 },
];

// ── Ritual Guide Data ──
//
// Design discipline (see comment in conversation 2026-05-18): every ritual has
// a signature anatomy, signature tool/finger configuration, and signature
// techniques that appear nowhere else in the app. References:
//   - Gua sha: Britta Plug / Sandra Lanshin Chiu protocols (15° angle, 3-5 reps)
//   - Lymphatic: Vodder method MLD (feather pressure, pumps + lifts, no sliding)
//   - Face lift: Carole Maggio Facercise + Danielle Collins (isometric holds)
//   - Buccal: Nichola Joss method (hand inside the mouth, masseter + buccinator)
//   - Pre-event: Joanna Czech / Georgia Louise pre-shoot facials (cold + percussion + speed)
//   - Eye revival: targeted orbital MLD (ring fingers only, tear trough → temple)
//   - Belly flow: abdominal lymphatic + "I Love You" colon massage
//
const rituals = [
  {
    id: "gua-sha", title: "Sculpt & Define", subtitle: "Gua Sha — stone work for the jawline, cheekbones, and neck",
    duration: "6 min", isPremium: false, svgFile: "/svgs/gua-sha-zones.svg", accent: "#BFA078",
    description: "True gua sha protocol with a stone tool held at a fifteen-degree angle. Every stroke is firm, outward, and repeated three to five times — the classical sequence used in Chinese facial practice and adapted by modern practitioners. Visible sculpting after a single session.",
    tools: "Gua sha stone (rose quartz, jade, or bian) · facial oil · about 6 minutes",
    occasion: "morning", audioFollowUp: 1,
    steps: [
      { title: "Warm the stone", duration: 22, instruction: "Oil your face. Warm the stone between your palms until it disappears into heat. One slow exhale before you begin.", zone: "full", direction: "● Centering" },
      { title: "Drain the neck first", duration: 22, instruction: "Long edge of the stone, fifteen degree angle. Five slow strokes down each side, behind the ear to the collarbone.", zone: "neck", direction: "↓ 15° angle, ×5 each side" },
      { title: "Scrape the jaw", duration: 22, instruction: "Center of the chin. Firm, never bruising. Sweep outward to the ear along the jawline. Five passes each side.", zone: "jawline", direction: "→ Chin to ear, ×5 each side" },
      { title: "Lift the marionette line", duration: 22, instruction: "Stone at the corner of your mouth. Sweep diagonally up to the top of the ear. Five passes each side.", zone: "marionette", direction: "↗ Diagonal, ×5 each side" },
      { title: "Undersweep the cheekbone", duration: 24, instruction: "Hook the curved edge under your cheekbone — not over it, under. Sweep firmly outward to the temple. Five passes each side.", zone: "cheeks", direction: "↗ Under bone, outward, ×5" },
      { title: "Dissolve the nasolabial fold", duration: 26, instruction: "Beside each nostril. Stone at fifteen degrees, diagonal sweep up to the temple. Five passes per side. This line softens with consistency, not force.", zone: "nasolabial", direction: "↗ Beside nose to temple, ×5" },
      { title: "Lift the brow bone", duration: 22, instruction: "Hook the stone notch under your brow bone. Three points — inner, middle, outer. Lift each upward for three seconds.", zone: "brow", direction: "↑ Three points, hold 3s each" },
      { title: "Finish at the forehead", duration: 22, instruction: "Long edge across your forehead. Three slow upward sweeps — center, then sides. End at the hairline. Set the stone down.", zone: "forehead", direction: "↑ Three sweeps to hairline" },
    ]
  },
  {
    id: "lymphatic", title: "Depuff & Restore Glow", subtitle: "Manual Lymphatic Drainage — fingers only, feather pressure",
    duration: "6 min", isPremium: true, svgFile: "/svgs/lymphatic-paths.svg", accent: "#8E9BA0",
    description: "True manual lymphatic drainage in the Vodder tradition. Pressure is featherlight — about five grams — because lymph vessels sit just under the skin and collapse if pressed harder. The work is pumps and lifts, never sliding. Always start and end at the collarbone terminus, where everything ultimately drains.",
    tools: "Clean fingertips and flat palms · no tools, no oil",
    occasion: "morning", audioFollowUp: 5,
    steps: [
      { title: "Open the terminus", duration: 22, instruction: "Flat palms across both collarbones. Press down gently and release. Ten slow pumps. You're opening the terminus — everything drains here.", zone: "neck", direction: "● Collarbone pump, ×10" },
      { title: "Pulse the parotid", duration: 22, instruction: "Flat fingertips on the soft place in front of each ear. Tiny inward circles, eight rotations. These are the parotid lymph nodes.", zone: "nodes", direction: "○ In front of ears, ×8" },
      { title: "Circle under the jaw", duration: 22, instruction: "Flat fingers along the underside of your jawline. Press and release, ten times. Do not slide. This is pumping, not stroking.", zone: "jawline", direction: "● Submandibular pump, ×10" },
      { title: "Lift the cheek, don't slide", duration: 24, instruction: "Flat fingers beside the nose. Lift the skin up and out toward the ear, then place it down. Never slide. Eight times each side.", zone: "cheeks", direction: "↗ Lift and place, ×8" },
      { title: "Ring-finger eye circles", duration: 22, instruction: "Ring fingers only — they apply the lightest pressure. Three slow circles around the orbital bone, each eye. Barely feel it.", zone: "orbital", direction: "○ Ring finger, ×3 circles" },
      { title: "Cascade the forehead", duration: 22, instruction: "Flat palms on your forehead. Lift outward toward the temples and place down. Never drag. Ten passes. No friction in lymphatic work.", zone: "forehead", direction: "↗ Lift and place, ×10" },
      { title: "Drain behind the ear", duration: 22, instruction: "Trace one fingertip from your temple, behind your ear, down to your neck. Three slow passes each side.", zone: "nodes", direction: "↓ Temple to neck, ×3" },
      { title: "Close the terminus", duration: 22, instruction: "Return to the collarbones. Same flat-palm press and release, ten times. The work continues for hours after you stop.", zone: "neck", direction: "● Collarbone pump, ×10" },
    ]
  },
  {
    id: "face-lift", title: "Lift & Firm", subtitle: "Face Yoga — isometric holds against finger resistance",
    duration: "7 min", isPremium: true, svgFile: "/svgs/face-lifting-points.svg", accent: "#C9A472",
    description: "This is not massage — this is muscle work. Isometric contractions against fingertip resistance, in the tradition of facial yoga (Carole Maggio, Danielle Collins). The face has over forty muscles and most of them have forgotten they're there. Holds are five to ten seconds. Repetitions matter. Visible tone with consistency.",
    tools: "Clean fingertips · facial oil",
    occasion: "evening", audioFollowUp: 3,
    steps: [
      { title: "Settle the breath", duration: 22, instruction: "Sit tall. Spine long. Three slow exhales. You are not massaging today — you are training the muscles underneath.", zone: "full", direction: "● Three exhales" },
      { title: "Forehead resistance hold", duration: 22, instruction: "Three fingers flat across your brow bone, pressing down. Raise your brows against the pressure. Hold ten seconds. Release. Five rounds.", zone: "forehead", direction: "↑ Hold 10s, ×5" },
      { title: "Wide-eye flash", duration: 22, instruction: "Anchor each temple with a fingertip. Open your eyes wide. Hold five seconds. Blink hard ten times. Close. Three rounds.", zone: "orbital", direction: "● Open, hold, blink, ×3 rounds" },
      { title: "Cheekbone lift hold", duration: 22, instruction: "Index fingers on top of your cheekbones. Smile up into them, against the resistance. Hold eight seconds. Release. Eight rounds.", zone: "cheeks", direction: "↗ Hold 8s, ×8" },
      { title: "The slow O", duration: 22, instruction: "Extreme oval with your mouth — like hiding your teeth with your lips. Jaw slightly forward. Hold ten seconds. Release. Five rounds.", zone: "marionette", direction: "● Extreme oval, hold 10s, ×5" },
      { title: "Smile against resistance", duration: 26, instruction: "Index fingertip at each corner of your mouth. Smile wide against the resistance. Push your fingers outward with the smile. Hold eight seconds. Six rounds.", zone: "marionette", direction: "↔ Push against fingers, ×6" },
      { title: "Platysma engage", duration: 24, instruction: "Tilt your head back. Reach your lower lip down toward your chin — hard. The platysma engages. Hold ten seconds. Release. Five rounds.", zone: "neck", direction: "↓ Lower lip down, hold 10s, ×5" },
      { title: "Cup and release", duration: 22, instruction: "Cup your face in warm palms. Light pressure. Hold ten seconds. Release. Notice what feels lifted from the inside.", zone: "full", direction: "● Palms covering, 10s" },
    ]
  },
  {
    id: "buccal", title: "Release & Decompress", subtitle: "Buccal Massage — hands inside the mouth, the deepest release",
    duration: "5 min", isPremium: true, svgFile: "/svgs/face-base.svg", accent: "#B08775",
    description: "Buccal massage in the Nichola Joss tradition — the technique used in private facials at Claridge's and Le Bristol. The thumb enters the mouth and works the masseter, buccinator, and pterygoid muscles directly, from inside. Most face tension lives in these muscles and cannot be reached any other way. Intimate, surprising, and unmistakably effective. Wash your hands.",
    tools: "Washed hands or single-use glove · facial oil · about 5 minutes",
    occasion: "recovery", audioFollowUp: 4,
    steps: [
      { title: "Cleanse the threshold", duration: 26, instruction: "Wash your hands thoroughly with hot water and soap. This is intimate work — fingers are about to enter your mouth. Glove if you have one.", zone: "full", direction: "● Wash hands first" },
      { title: "Warm the masseter outside", duration: 26, instruction: "Knuckles on the muscle in front of each ear. Clench your jaw — that's the masseter. Slow circles, twenty seconds. Warm it from the outside first.", zone: "jawline", direction: "○ Outside circles, 20s" },
      { title: "Milk the masseter from inside", duration: 26, instruction: "Clean thumb inside your cheek, against the masseter. Fingers anchor outside, opposite the thumb. Slow firm milking strokes top to bottom. Five passes each side.", zone: "jawline", direction: "↓ Thumb inside, ×5 each side" },
      { title: "Circle the cheek pillow", duration: 22, instruction: "Thumb still inside. Move to the soft cushion of the cheek — the buccinator. Slow firm circles, five rotations each side.", zone: "cheeks", direction: "○ Inside circles, ×5 each side" },
      { title: "Pinch from both sides", duration: 26, instruction: "Thumb inside, index finger outside. Pinch the cheek gently between them. Walk this pinch from the corner of your mouth toward the ear. Three passes each side.", zone: "marionette", direction: "● Inside-outside pinch, ×3" },
      { title: "Sweep the upper buccal fold", duration: 24, instruction: "Thumb above your upper teeth, where gum meets lip. Slow firm glide from one corner of your mouth to the other. Three passes.", zone: "nasolabial", direction: "→ Above the teeth, ×3" },
      { title: "Return to the surface", duration: 22, instruction: "Hands back outside. Glide warm palms over the same areas — masseter, cheek, jaw. Notice the difference. Wash your hands again.", zone: "full", direction: "● Outside integration · wash hands" },
    ]
  },
  {
    id: "pre-event", title: "Show Up Glowing", subtitle: "Pre-Event Ritual — cold, percussion, and speed",
    duration: "4 min", isPremium: true, svgFile: "/svgs/face-base.svg", accent: "#D4C094",
    description: "The technique facialists use before a shoot or red carpet. Cold tools for instant vasoconstriction, rapid percussion tapping to bring blood to the surface, fast lymphatic flushing, and a cold seal at the end. The opposite tempo of the other rituals — urgency is the technique. Four minutes, visible result.",
    tools: "Chilled gua sha stone or cold spoons (from the freezer) · facial oil · about 4 minutes",
    occasion: "event", audioFollowUp: 2,
    steps: [
      { title: "Cold prep on the eyes", duration: 24, instruction: "Cold stone, chilled spoons, or ice in a tea towel. Press to your closed eyes for thirty seconds. Vasoconstriction. Do not skip this.", zone: "orbital", direction: "● Cold on closed eyes, 30s" },
      { title: "Speed drainage", duration: 24, instruction: "Fast firm strokes down both sides of the neck. Eight per side at twice the pace that feels comfortable. We're opening the drain.", zone: "neck", direction: "↓ Fast neck strokes, ×8" },
      { title: "Percussion tapping", duration: 22, instruction: "Fingertips across your entire face — tap rapidly for forty-five seconds. Like soft rain. Forehead, cheekbones, jaw, neck. Wake the circulation.", zone: "full", direction: "● Rapid tapping, 45s" },
      { title: "Snap-lift the cheekbone", duration: 26, instruction: "Flat fingers under each cheekbone. Quick firm lifts up and out toward the temple — snap, snap, snap. Eight per side. Speed creates lift.", zone: "cheeks", direction: "↗ Fast lifts, ×8 each side" },
      { title: "Brow flicks", duration: 22, instruction: "Short upward flicking strokes along the brow bone, finger pads. Ten per side. The brow opens. The eye opens with it.", zone: "brow", direction: "↑ Quick flicks, ×10 each side" },
      { title: "Cold seal", duration: 22, instruction: "Wash your hands in cold water. Press cold palms flat against your face. Hold ten seconds. Release. You're ready.", zone: "full", direction: "● Cold palms, hold 10s" },
    ]
  },
  {
    id: "eye-revival", title: "Brighten & Open", subtitle: "Eye Revival — ring fingers and the orbital bone, nothing else",
    duration: "5 min", isPremium: true, svgFile: "/svgs/face-base.svg", accent: "#998BA0",
    description: "Targeted orbital drainage. The under-eye skin is the thinnest on the body — about 0.5 millimeters — and the ring finger is the only finger that can move it without overpressuring it. Every step is built around specific landmarks on the orbital bone: the tear trough, the brow trio, the temple anchor. Cold tools amplify it. Never pull skin.",
    tools: "Ring fingers only · optional chilled spoon or eye stone · serum",
    occasion: "morning", audioFollowUp: 5,
    steps: [
      { title: "Cold compress", duration: 26, instruction: "Chilled spoons, a cold stone, or your washed-cold ring fingertips. Hold gently against closed eyes. Thirty seconds. The cold does most of the work.", zone: "orbital", direction: "● Cold on closed eyes, 30s" },
      { title: "Tear trough press", duration: 24, instruction: "Ring fingertip at the inner corner of each eye. Press straight down into the bone underneath. Five seconds, release. Repeat three times.", zone: "orbital", direction: "● Hold 5s, ×3 each side" },
      { title: "Inner-to-outer under-eye", duration: 26, instruction: "Ring finger only. Glide from the inner corner along the orbital bone outward to the temple. Five passes each side. If the skin moves, you're pressing too hard.", zone: "undereye", direction: "→ Ring finger only, ×5 each" },
      { title: "Brow bone trio", duration: 24, instruction: "Three points along the brow bone — inner, middle, outer. Press each with your ring finger for five seconds. Releases the corrugator. The eye opens.", zone: "brow", direction: "● Three points, hold 5s each" },
      { title: "Crow's-feet anchor", duration: 26, instruction: "Pin the skin firmly at your temple with one fingertip. With your other ring finger, micro-circle at the outer corner of the eye. Ten circles each side.", zone: "orbital", direction: "○ Temple anchor + circles, ×10" },
      { title: "Upper lid glide", duration: 22, instruction: "Eyes closed. Ring finger pads on your upper eyelids. Glide outer corner inward. Three slow passes. This is the upper lid's own drainage path.", zone: "orbital", direction: "← Outer to inner, ×3" },
      { title: "Drain to the ear", duration: 24, instruction: "From the outer corner of each eye, glide down in front of the ear to the jaw. Three passes each side. Everything drains here.", zone: "nodes", direction: "↓ Outer eye to jaw, ×3" },
    ]
  },
  {
    id: "belly-flow", title: "Soften the Belly", subtitle: "Abdominal Lymphatic Drainage — debloat and calm the gut",
    duration: "6 min", isPremium: true, svgFile: "/svgs/face-base.svg", accent: "#A8916C",
    description: "A real lymphatic drainage sequence for the abdomen — the kind massage therapists charge €200/hour for. Releases trapped fluid, eases bloating, and signals the gut that the bracing can stop. Follows the actual colonic and inguinal lymph pathways. Best done on an empty or near-empty stomach, lying down.",
    tools: "Clean flat hands · body oil optional · skip if pregnant or recovering from abdominal surgery",
    occasion: "evening", audioFollowUp: 5,
    steps: [
      { title: "Ground yourself first", duration: 30, instruction: "Lie back or sit tall. Hands flat on the lower belly. Three slow breaths — the kind where the belly rises before the chest. You're inviting the gut to soften. Don't rush this.", zone: "full", direction: "● Belly breathing" },
      { title: "Open the drainage path", duration: 40, instruction: "Find the crease where your thigh meets your hip — both sides. Pulse gently with flat fingers, ten times each side. The lymphatic gates open here. You have to open the door before you move anything through it.", zone: "inguinal", direction: "● Inguinal nodes" },
      { title: "Wake the diaphragm", duration: 45, instruction: "Hands just under the ribs, fingers softly curved in. As you inhale, press gently down with your fingers. Exhale, release. Five slow rounds. This is where the lymph pump lives — most people have forgotten it's there.", zone: "diaphragm", direction: "↓ With breath" },
      { title: "Down the left", duration: 45, instruction: "Flat hand on your left side, just under the ribs. Stroke firmly downward to your hip. Slow, sustained pressure. Five passes. This follows the descending colon. You're moving what's been stuck.", zone: "left-side", direction: "↓ Ribs to hip, left" },
      { title: "Across the top", duration: 50, instruction: "From your right hip, sweep up to under the right ribs, then straight across to the left ribs, then down to the left hip. One smooth, unbroken pass. Three times. Every stroke moves things in the direction they want to go.", zone: "top-sweep", direction: "↑ → ↓ Full colon path" },
      { title: "The I Love You", duration: 55, instruction: "Now the full sequence: an I down the left side, an inverted L across the top and down the left, and a U up the right, across, and down the left. Three full rounds. Yes, your gut knows it's being told something kind.", zone: "colon-path", direction: "I · L · U · ×3" },
      { title: "Around the navel", duration: 50, instruction: "Both hands stacked over your belly button. Ten slow clockwise circles — always clockwise, never against it. Light, then a little deeper. The colon is right under your hand. You're walking it home.", zone: "navel", direction: "○ Clockwise, ×10" },
      { title: "Drain it down", duration: 40, instruction: "Back to the inguinal crease. Press and hold both hands there for ten counts. Everything you just moved drains here. Three slow breaths. Notice what's softer than when you started.", zone: "inguinal", direction: "● Hold · 10 counts" },
    ]
  },
];

const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
// ── Plausible event tracking — safe no-op if the script hasn't loaded
//    (or if the user is offline). Use sparingly; only the events that
//    matter to the activation + revenue funnel.
const trackEvent = (name, props) => {
  try { window.plausible?.(name, props ? { props } : undefined); } catch {}
};

const greetUser = (name) => { const h=new Date().getHours(); const g=h<12?"Good morning":h<17?"Good afternoon":"Good evening"; return name?`${g}, ${name}`:g; };
const greetShort = () => { const h=new Date().getHours(); if(h<10)return"This morning"; if(h<14)return"This midday"; if(h<18)return"This afternoon"; return"This evening"; };
const timeCtx = () => { const h=new Date().getHours(); if(h<6)return"night"; if(h<10)return"morning"; if(h<14)return"midday"; if(h<18)return"afternoon"; if(h<21)return"evening"; return"night"; };

// ── Date helpers for streak / daily reset (local time, YYYY-MM-DD) ──
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const yesterdayOf = (dateStr) => {
  if(!dateStr) return null;
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d); dt.setDate(dt.getDate()-1);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};
// Recommend a ritual + audio arc based on state and time
const getArc = (checkinState, tc) => {
  if(checkinState) {
    const r = rituals.find(x=>x.id===checkinState.ritualId) || rituals[0];
    const a = sessions.find(x=>x.id===(r.audioFollowUp||1)) || sessions[0];
    return { ritual:r, audio:a };
  }
  if(tc==="morning") return { ritual:rituals[0], audio:sessions[0] };
  if(tc==="evening") return { ritual:rituals[2], audio:sessions[2] };
  return { ritual:rituals[0], audio:sessions[4] };
};
const load = (k,fb) => { try { const v=localStorage.getItem(`obriz_${k}`); return v!==null?JSON.parse(v):fb; } catch{return fb;} };
const save = (k,v) => { try{localStorage.setItem(`obriz_${k}`,JSON.stringify(v));}catch{} };

// ── Circular Progress Ring ──
function Ring({ progress, size=120, sw=2.5, color=B.gold }) {
  const r=(size-sw)/2, c=r*2*Math.PI, off=c-(progress/100)*c;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}15`} strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s ease"}}/>
    </svg>
  );
}

// ── Breathing Orb ──
function Orb({ active, size=200 }) {
  const [ph,setPh]=useState(0);
  useEffect(()=>{ if(!active)return; const iv=setInterval(()=>setPh(p=>(p+1)%720),40); return()=>clearInterval(iv); },[active]);
  const cyc=Math.sin((ph*Math.PI)/360), sc=active?0.85+cyc*0.15:0.9, op=active?0.25+cyc*0.2:0.15;
  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {[1,0.75,0.5].map((s,i)=>(
        <div key={i} style={{position:"absolute",width:size*s,height:size*s,borderRadius:"50%",
          background:`radial-gradient(circle,${B.gold}${Math.round((op-i*0.05)*255).toString(16).padStart(2,'0')} 0%,transparent 70%)`,
          transform:`scale(${sc+i*0.03})`,transition:active?"none":"transform 2s ease"}}/>
      ))}
    </div>
  );
}

// ── NS Score Ring ──
function NSScore({ score, size=100 }) {
  const r=42,c=r*2*Math.PI,off=c-(score/100)*c,col=score>=70?"#5A8A5A":score>=40?B.gold:"#C4786A";
  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${col}15`} strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={3} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset 1.5s ease"}}/>
      </svg>
      <span style={{fontSize:28,color:B.cream,fontFamily:SF,fontWeight:300,zIndex:2}}>{score}</span>
    </div>
  );
}

// ══════════════════════════════════════
// GUIDED MICRO-INTERVENTION COMPONENTS
// ══════════════════════════════════════

function GuideSigh({ onComplete }) {
  const [cycle,setCycle]=useState(0);
  const [phase,setPhase]=useState("prep");
  const [count,setCount]=useState(3);
  const totalCycles=4;
  const timerRef=useRef(null);

  useEffect(()=>{
    clearTimeout(timerRef.current);
    if(phase==="prep") timerRef.current=setTimeout(()=>{setPhase("inhale1");setCount(3);},1200);
    else if(phase==="inhale1") { if(count>1) timerRef.current=setTimeout(()=>setCount(c=>c-1),800); else timerRef.current=setTimeout(()=>{setPhase("inhale2");setCount(0);},800); }
    else if(phase==="inhale2") timerRef.current=setTimeout(()=>{setPhase("exhale");setCount(6);},900);
    else if(phase==="exhale") { if(count>1) timerRef.current=setTimeout(()=>setCount(c=>c-1),1000); else timerRef.current=setTimeout(()=>{ if(cycle+1>=totalCycles) onComplete?.(); else { setCycle(c=>c+1); setPhase("inhale1"); setCount(3); }},1000); }
    return()=>clearTimeout(timerRef.current);
  },[phase,count,cycle]);

  const scale=phase==="inhale1"?1.0:phase==="inhale2"?1.2:phase==="exhale"?0.7:0.85;
  const dur=phase==="inhale1"?"2.5s":phase==="inhale2"?"0.8s":phase==="exhale"?"6s":"0.5s";
  const instruction=phase==="prep"?"Prepare yourself...":phase==="inhale1"?"Inhale through your nose":phase==="inhale2"?"Quick second inhale":"Long slow exhale through mouth";

  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Physiological sigh</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:36,fontFamily:SF}}>Cycle {cycle+1} of {totalCycles}</p>
      <div style={{position:"relative",width:160,height:160,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36}}>
        <div style={{position:"absolute",width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${B.gold}${phase==="exhale"?"0F":"2E"} 0%,transparent 70%)`,transform:`scale(${scale})`,transition:`transform ${dur} ease-in-out`}}/>
        <div style={{position:"absolute",width:112,height:112,borderRadius:"50%",border:`1px solid ${B.gold}${phase==="exhale"?"15":"30"}`,transform:`scale(${scale})`,transition:`transform ${dur} ease-in-out`}}/>
        <span style={{fontSize:32,color:B.cream,fontWeight:300,zIndex:2,fontFamily:F}}>{phase==="inhale2"?"":count||""}</span>
      </div>
      <p style={{fontSize:19,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:6,minHeight:28}}>{instruction}</p>
      <div style={{display:"flex",gap:6,marginTop:32}}>
        {Array.from({length:totalCycles},(_,i)=>(<div key={i} style={{width:i<=cycle?24:16,height:3,borderRadius:2,background:i<cycle?B.gold:i===cycle?`${B.gold}80`:`${B.gold}20`,transition:"all 0.4s"}}/>))}
      </div>
    </div>
  );
}

const groundSenses = [
  { count:5,sense:"see",instruction:"Look around and name 5 things you can see",color:"#8BAA8B",prompt:"Notice colors, shapes, textures. Take your time with each one." },
  { count:4,sense:"touch",instruction:"Notice 4 things you can physically feel",color:"#C49A4B",prompt:"The chair beneath you. Fabric on your skin. Your feet on the floor." },
  { count:3,sense:"hear",instruction:"Listen for 3 sounds around you",color:"#8A9BAF",prompt:"Close your eyes if it helps. Distant sounds, near sounds, subtle ones." },
  { count:2,sense:"smell",instruction:"Notice 2 things you can smell",color:"#A08BAA",prompt:"If you can't detect anything, recall a scent you love." },
  { count:1,sense:"taste",instruction:"Notice 1 thing you can taste",color:"#C4786A",prompt:"The inside of your mouth. A lingering flavor. A sip of water." },
];

function GuideGround({ onComplete }) {
  const [step,setStep]=useState(0);
  const [timeLeft,setTimeLeft]=useState(10);
  const timerRef=useRef(null);
  useEffect(()=>{
    setTimeLeft(10); clearInterval(timerRef.current);
    if(step>=groundSenses.length) { onComplete?.(); return; }
    timerRef.current=setInterval(()=>{ setTimeLeft(t=>{ if(t<=1){clearInterval(timerRef.current);setTimeout(()=>setStep(s=>s+1),400);return 0;} return t-1; }); },1000);
    return()=>clearInterval(timerRef.current);
  },[step]);
  if(step>=groundSenses.length) return null;
  const sense=groundSenses[step]; const pct=((10-timeLeft)/10)*100;
  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>5-4-3-2-1 Grounding</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:32,fontFamily:SF}}>Step {step+1} of 5</p>
      <div style={{position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
        <Ring progress={pct} size={120} sw={2.5} color={sense.color}/><span style={{fontSize:38,color:B.cream,fontWeight:300,zIndex:2}}>{sense.count}</span>
      </div>
      <p style={{fontSize:18,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:8,lineHeight:1.4,maxWidth:280}}>{sense.instruction}</p>
      <p style={{fontSize:12,color:B.muted,fontFamily:F,lineHeight:1.5,maxWidth:260,marginBottom:8}}>{sense.prompt}</p>
      <div style={{width:200,height:3,borderRadius:2,background:`${B.gold}15`,marginTop:24}}><div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:sense.color,transition:"width 0.8s ease"}}/></div>
      <p style={{fontSize:10,color:B.muted,fontFamily:SF,marginTop:8}}>{timeLeft}s</p>
    </div>
  );
}

const jawSteps = [
  { title:"Let your jaw drop", instruction:"Allow your mouth to fall open naturally. Don't force it — just release the muscles holding it closed.", hold:10 },
  { title:"Release your tongue", instruction:"Let your tongue fall away from the roof of your mouth. Rest it gently behind your lower teeth.", hold:10 },
  { title:"Massage the hinge", instruction:"Place your fingertips where your jaw meets your skull. Apply gentle circular pressure on both sides.", hold:12 },
];

function GuideJaw({ onComplete }) {
  const [step,setStep]=useState(0);const [timeLeft,setTimeLeft]=useState(jawSteps[0].hold);const timerRef=useRef(null);
  useEffect(()=>{
    if(step>=jawSteps.length){onComplete?.();return;} setTimeLeft(jawSteps[step].hold); clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{ setTimeLeft(t=>{ if(t<=1){clearInterval(timerRef.current);setTimeout(()=>setStep(s=>s+1),500);return 0;} return t-1; }); },1000);
    return()=>clearInterval(timerRef.current);
  },[step]);
  if(step>=jawSteps.length) return null;
  const js=jawSteps[step]; const pct=((js.hold-timeLeft)/js.hold)*100;
  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Jaw release</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:32,fontFamily:SF}}>Hold {step+1} of {jawSteps.length}</p>
      <div style={{position:"relative",width:140,height:140,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
        <Ring progress={pct} size={140} sw={2.5}/>
        <div style={{textAlign:"center",zIndex:2}}><span style={{fontSize:32,color:B.cream,fontWeight:300,display:"block"}}>{timeLeft}</span><span style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF}}>hold</span></div>
      </div>
      <p style={{fontSize:19,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:8}}>{js.title}</p>
      <p style={{fontSize:12,color:B.muted,fontFamily:F,lineHeight:1.5,maxWidth:270}}>{js.instruction}</p>
      <div style={{display:"flex",gap:6,marginTop:32}}>{jawSteps.map((_,i)=>(<div key={i} style={{width:i<=step?24:16,height:3,borderRadius:2,background:i<step?B.gold:i===step?`${B.gold}60`:`${B.gold}15`,transition:"all 0.4s"}}/>))}</div>
    </div>
  );
}

function GuideTap({ onComplete }) {
  const [timeLeft,setTimeLeft]=useState(30);const [side,setSide]=useState("left");const timerRef=useRef(null);const tapRef=useRef(null);
  useEffect(()=>{
    timerRef.current=setInterval(()=>{ setTimeLeft(t=>{ if(t<=1){clearInterval(timerRef.current);clearInterval(tapRef.current);onComplete?.();return 0;} return t-1; }); },1000);
    tapRef.current=setInterval(()=>setSide(s=>s==="left"?"right":"left"),900);
    return()=>{clearInterval(timerRef.current);clearInterval(tapRef.current);};
  },[]);
  const pct=((30-timeLeft)/30)*100; const isL=side==="left";
  return (
    <div style={{textAlign:"center",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6}}>Butterfly tap</p>
      <p style={{fontSize:12,color:B.muted,marginBottom:8,fontFamily:SF}}>Cross your arms over your chest</p>
      <div style={{position:"relative",width:200,height:200,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
        <Ring progress={pct} size={200} sw={2}/>
        <div style={{display:"flex",gap:28,zIndex:2}}>
          {["L","R"].map((l,i)=>{const active=i===0?isL:!isL;return(
            <div key={l} style={{width:60,height:60,borderRadius:"50%",background:active?`${B.gold}33`:`${B.gold}0D`,border:`1.5px solid ${active?`${B.gold}80`:`${B.gold}1A`}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s ease",transform:`scale(${active?1.15:0.9})`}}>
              <span style={{fontSize:11,color:active?B.gold:B.muted,fontWeight:500,letterSpacing:1,fontFamily:SF}}>{l}</span>
            </div>
          );})}
        </div>
      </div>
      <p style={{fontSize:19,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:4}}>Tap {isL?"left":"right"} shoulder</p>
      <p style={{fontSize:12,color:B.muted,fontFamily:F}}>Slow, gentle, rhythmic</p>
      <p style={{fontSize:28,color:B.cream,fontWeight:300,marginTop:20,fontFamily:SF}}>{timeLeft}s</p>
    </div>
  );
}

function GuideComplete({ message, onClose }) {
  return (
    <div style={{textAlign:"center",padding:"40px 20px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,border:`1px solid ${B.gold}30`}}>
        <Check size={30} color={B.gold}/>
      </div>
      <h2 style={{fontSize:22,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>You showed up.</h2>
      <p style={{fontSize:13,color:B.muted,margin:"0 0 8px",fontFamily:F}}>Your face, your nervous system — both listened.</p>
      <p style={{fontSize:12,color:B.gold,fontFamily:SF,margin:"0 0 32px"}}>{message}</p>
      <button onClick={onClose} style={{background:B.goldGrad,border:"none",borderRadius:28,padding:"13px 36px",cursor:"pointer",color:B.warmBlack,fontSize:13,fontFamily:SF,letterSpacing:1,fontWeight:500}}>Continue</button>
    </div>
  );
}

// ══════════════════════════════════════
// RITUAL GUIDE PLAYER
// ══════════════════════════════════════
function RitualPlayer({ ritual, onClose, onComplete }) {
  const [step,setStep]=useState(-1); // -1 = overview
  const [timeLeft,setTimeLeft]=useState(0);
  const [paused,setPaused]=useState(false);
  const timerRef=useRef(null);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem("rhei_mirror_voice") !== "0"; } catch { return true; }
  });
  const voiceAudioRef = useRef(null);

  // ── Camera mode (live mirror inside the ritual) ──
  // Opt-in: the default ritual experience is the woman's portrait with
  // animated gestures (no camera). A clear "Do it on my face" toggle on
  // the player turns on the camera — the user's own face becomes the main
  // view with the woman as a small reference PiP in the upper-right.
  // Permission is requested only when the toggle is enabled, and the
  // preference is remembered so the user isn't re-prompted next session.
  const [cameraMode, setCameraMode] = useState(() => {
    try { return localStorage.getItem("rhei_camera_mode") === "1"; } catch { return false; }
  });
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | ready | denied
  useEffect(() => {
    try { localStorage.setItem("rhei_camera_mode", cameraMode ? "1" : "0"); } catch {}
  }, [cameraMode]);

  const currentStep = step >= 0 && step < ritual.steps.length ? ritual.steps[step] : null;
  const totalSteps = ritual.steps.length;

  // Persist voice toggle (shared with Mirror Mode)
  useEffect(() => {
    try { localStorage.setItem("rhei_mirror_voice", voiceEnabled ? "1" : "0"); } catch {}
  }, [voiceEnabled]);

  // Voiceover — Lulu's MP3 for this step, TTS fallback only if file is missing.
  // The `stopped` flag (closure-scoped per effect run) prevents any late event
  // — late-arriving error, delayed play() rejection, etc. — from firing TTS or
  // restarting audio AFTER we've torn down. This eliminates the desync where
  // the previous step's audio could ghost-fire into the next step.
  useEffect(() => {
    if (!voiceEnabled) {
      try { window.speechSynthesis?.cancel(); } catch {}
      if (voiceAudioRef.current) { try { voiceAudioRef.current.pause(); } catch {} }
      return;
    }
    if (step < 0 || step >= totalSteps) return;
    const stepData = ritual.steps[step];
    if (!stepData) return;
    const text = `${stepData.title}. ${stepData.instruction || ""}`.trim();

    // Synchronously tear down any TTS still going from the previous step.
    // The audio element itself is REUSED (see below) so we don't tear it down.
    try { window.speechSynthesis?.cancel(); } catch {}

    let stopped = false;
    let usingTts = false;

    const playTts = () => {
      if (stopped) return;
      if (!("speechSynthesis" in window)) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.88; u.pitch = 1.02; u.volume = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => /en/i.test(v.lang) && /(samantha|ava|jenny|aria|female)/i.test(v.name))
                       || voices.find(v => /en/i.test(v.lang));
        if (preferred) u.voice = preferred;
        usingTts = true;
        window.speechSynthesis.speak(u);
      } catch {}
    };

    const url = `/audio/rituals/${ritual.id}-${step}.mp3`;

    // CRITICAL: REUSE a single audio element across all steps of a ritual.
    // iOS Safari and Chrome only allow audio.play() if the call chain
    // originates from a user gesture (tap). When the step advances via
    // the auto-advance setTimeout there is no gesture in the chain, so
    // creating a fresh Audio() per step gets blocked silently.
    // An audio element that was previously unlocked by a user gesture
    // (the Begin tap on step 1) keeps its permission across src changes,
    // so we just update src and call play() on the same element.
    if (!voiceAudioRef.current) {
      voiceAudioRef.current = new Audio();
      voiceAudioRef.current.volume = 0.95;
      voiceAudioRef.current.preload = "auto";
    }
    const audio = voiceAudioRef.current;
    try { audio.pause(); } catch {}
    audio.onerror = () => {
      if (stopped) return;
      // Genuine load failure — fall back to TTS
      playTts();
    };
    audio.src = url;
    try { audio.load(); } catch {}

    audio.play().catch(() => {
      // play() rejected. Wait one tick — if still paused at 0, fall to TTS.
      setTimeout(() => {
        if (stopped) return;
        if (audio.paused && audio.currentTime === 0) {
          playTts();
        }
      }, 400);
    });

    return () => {
      stopped = true;
      // DO NOT null voiceAudioRef.current — keep the unlocked element
      // alive across step changes so auto-advance audio still plays.
      // It's fully released by the unmount-only effect below.
      try { audio.pause(); } catch {}
      audio.onerror = null;
      if (usingTts) { try { window.speechSynthesis.cancel(); } catch {} }
    };
  }, [step, voiceEnabled, ritual, totalSteps]);

  // Stop audio entirely when player unmounts
  useEffect(() => {
    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
      if (voiceAudioRef.current) { try { voiceAudioRef.current.pause(); } catch {} voiceAudioRef.current = null; }
    };
  }, []);

  useEffect(()=>{
    if(step < 0 || step >= totalSteps || paused) return;
    setTimeLeft(currentStep.duration);
    clearInterval(timerRef.current);
    let advanceTimeout = null;
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1) {
          clearInterval(timerRef.current);
          // Auto-advance so the user can keep their hands on their face.
          // 400ms grace so the "0" reads briefly before the next gesture
          // appears. Cancelled by cleanup if the user pauses or manually
          // advances during the window.
          advanceTimeout = setTimeout(()=>nextStep(), 400);
          return 0;
        }
        return t-1;
      });
    },1000);
    return()=>{
      clearInterval(timerRef.current);
      if(advanceTimeout) clearTimeout(advanceTimeout);
    };
  },[step,paused]);

  const nextStep = () => {
    if(step+1 >= totalSteps) {
      setStep(totalSteps);
      onComplete?.({ ritualType: ritual.id, totalDuration: ritual.steps.reduce((s,x)=>s+x.duration,0) });
    } else setStep(s=>s+1);
  };

  const prevStep = () => { if(step > 0) setStep(s=>s-1); };

  // Overview
  if(step === -1) {
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`rgba(8,5,3,0.98)`,backdropFilter:"blur(12px)",zIndex:100,overflowY:"auto"}}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:300,background:"radial-gradient(ellipse at 50% 0%, rgba(196,154,75,0.06) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:430,margin:"0 auto",padding:"24px 22px 40px",position:"relative"}}>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.muted,fontFamily:SF,fontSize:11,marginBottom:28,letterSpacing:0.5}}><ChevronLeft size={14}/><span>Back</span></button>
          <div style={{textAlign:"center",marginBottom:28}}>
            <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:8}}>Ritual Guide</p>
            <h1 style={{fontSize:24,fontWeight:400,color:B.cream,margin:"0 0 6px",fontFamily:F}}>{ritual.title}</h1>
            <p style={{fontSize:13,color:B.muted,margin:"0 0 16px"}}>{ritual.subtitle}</p>
          </div>
          <div style={{width:"100%",height:260,borderRadius:20,background:B.card,border:`1px solid ${B.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,overflow:"hidden"}}>
            <RitualStepImage
              ritualId={ritual.id}
              stepIndex={1}
              zone={ritual.id==="gua-sha"?"jawline":ritual.id==="lymphatic"?"nodes":ritual.id==="belly-flow"?"navel":"cheeks"}
              width={"100%"}
              height={260}
              radius={0}
              shadow={false}
              showGestures={false}
            />
          </div>
          <div style={{background:B.card,borderRadius:16,padding:18,border:`1px solid ${B.border}`,marginBottom:16}}>
            <p style={{fontSize:12,color:B.creamMuted,margin:0,lineHeight:1.6,fontFamily:SF}}>{ritual.description}</p>
          </div>
          <div style={{display:"flex",gap:12,marginBottom:24}}>
            <div style={{flex:1,background:B.card,borderRadius:12,padding:"12px 14px",border:`1px solid ${B.border}`,textAlign:"center"}}>
              <Clock size={14} color={B.gold} style={{marginBottom:4}}/>
              <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>{ritual.duration}</p>
              <p style={{fontSize:9,color:B.muted,margin:"2px 0 0",textTransform:"uppercase",letterSpacing:1,fontFamily:SF}}>Duration</p>
            </div>
            <div style={{flex:1,background:B.card,borderRadius:12,padding:"12px 14px",border:`1px solid ${B.border}`,textAlign:"center"}}>
              <Hand size={14} color={B.gold} style={{marginBottom:4}}/>
              <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>{ritual.steps.length} steps</p>
              <p style={{fontSize:9,color:B.muted,margin:"2px 0 0",textTransform:"uppercase",letterSpacing:1,fontFamily:SF}}>Guided</p>
            </div>
          </div>
          <div style={{background:B.card,borderRadius:12,padding:"12px 16px",border:`1px solid ${B.border}`,marginBottom:28}}>
            <p style={{fontSize:10,color:B.gold,margin:"0 0 4px",fontFamily:SF,letterSpacing:1,textTransform:"uppercase"}}>You'll need</p>
            <p style={{fontSize:12,color:B.creamMuted,margin:0,fontFamily:SF}}>{ritual.tools}</p>
          </div>
          <button onClick={()=>setStep(0)} style={{width:"100%",background:B.goldGrad,border:"none",borderRadius:28,padding:"16px",cursor:"pointer",color:B.warmBlack,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:600,boxShadow:`0 6px 28px ${B.gold}30`}}>Begin</button>
        </div>
      </div>
    );
  }

  // Completion
  if(step >= totalSteps) {
    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F8`,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",padding:32,maxWidth:340}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",border:`1px solid ${B.gold}30`}}>
            <Sparkles size={32} color={B.gold}/>
          </div>
          <h2 style={{fontSize:24,color:B.cream,fontWeight:400,margin:"0 0 8px",fontFamily:F}}>You showed up.</h2>
          <p style={{fontSize:15,color:B.creamMuted,margin:"0 0 6px",fontFamily:F}}>Your face is softer, more open, and more lifted.</p>
          <p style={{fontSize:12,color:B.muted,fontFamily:SF,margin:"0 0 28px"}}>{ritual.title} · {ritual.duration}</p>
          <button onClick={onClose} style={{background:B.goldGrad,border:"none",borderRadius:28,padding:"14px 40px",cursor:"pointer",color:B.warmBlack,fontSize:14,fontFamily:SF,letterSpacing:1,fontWeight:500}}>Continue</button>
        </div>
      </div>
    );
  }

  // Active step
  const pct = currentStep ? ((currentStep.duration - timeLeft) / currentStep.duration) * 100 : 0;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F8`,zIndex:100,overflowY:"auto"}}>
      <div style={{maxWidth:430,margin:"0 auto",padding:"24px 22px 40px",display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh"}}>
        <button onClick={onClose} style={{position:"absolute",top:18,right:18,background:"none",border:"none",cursor:"pointer",zIndex:10}}><X size={18} color={B.muted}/></button>
        <button
          onClick={() => setVoiceEnabled(v => !v)}
          aria-label={voiceEnabled ? "Mute Lulu's voice" : "Unmute Lulu's voice"}
          style={{position:"absolute",top:16,left:18,background:"rgba(26,15,6,0.55)",backdropFilter:"blur(8px)",border:`1px solid ${voiceEnabled ? B.gold + "40" : B.border}`,borderRadius:"50%",width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:voiceEnabled?B.gold:B.muted,padding:0,zIndex:10}}>
          {voiceEnabled ? <Volume2 size={15}/> : <VolumeX size={15}/>}
        </button>

        <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:6,marginTop:8}}>{ritual.title}</p>
        <p style={{fontSize:10,color:B.muted,marginBottom:24,fontFamily:SF,letterSpacing:"0.22em",textTransform:"uppercase",fontVariantNumeric:"tabular-nums"}}>
          Step {String(step+1).padStart(2,"0")} <span style={{opacity:0.45,margin:"0 6px"}}>/</span> {String(totalSteps).padStart(2,"0")}
        </p>

        {/* Progress dots — editorial pill row */}
        <div style={{display:"flex",gap:5,marginBottom:32,flexWrap:"wrap",justifyContent:"center",maxWidth:280}}>
          {ritual.steps.map((_,i)=>(<div key={i} style={{
            width:i===step?22:7,
            height:3,
            borderRadius:2,
            background:i<step?B.gold:i===step?B.goldLight:`${B.gold}22`,
            boxShadow:i===step?`0 0 6px ${B.gold}80`:"none",
            transition:"all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
          }}/>))}
        </div>

        {/* Editorial step view + timer.
            cameraMode=true (default): user's camera is the main view with
            gold gestures animating on their face via MediaPipe tracking, and
            the woman portrait sits as a small reference PiP in the upper-right.
            cameraMode=false OR camera denied: the static portrait experience.
            Toggle button below the view lets the user switch any time. */}
        <div style={{position:"relative",width:"100%",display:"flex",justifyContent:"center",alignItems:"center",marginBottom:16}}>
          <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {(cameraMode && cameraStatus !== "denied") ? (
              <div style={{position:"relative"}}>
                <RitualMirrorView
                  ritualId={ritual.id}
                  stepIndex={step + 1}
                  width={300}
                  height={380}
                  onCameraStatus={setCameraStatus}
                />
              </div>
            ) : (
              <RitualStepImage ritualId={ritual.id} stepIndex={step + 1} zone={currentStep.zone||"full"} size={260}/>
            )}
            {/* Floating timer pill */}
            <div style={{position:"absolute",bottom:14,right:-10,background:B.card,border:`1px solid ${B.borderActive}`,borderRadius:20,padding:"5px 12px",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 16px ${B.warmBlack}60`,zIndex:5}}>
              <div style={{position:"relative",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ring progress={pct} size={28} sw={2.5}/>
                <span style={{fontSize:9,color:B.cream,fontWeight:500,zIndex:2,fontFamily:SF}}>{timeLeft}</span>
              </div>
              <span style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF}}>sec</span>
            </div>
          </div>
        </div>

        {/* Camera option — opt-in pill that turns on the live mirror.
            When enabled, the user's own face becomes the main view and
            the woman portrait shifts to a small reference PiP in the
            corner. Permission is requested only when the user opts in. */}
        {hasAnimatedSteps(ritual.id) && (
          <button
            onClick={() => {
              if (cameraStatus === "denied") setCameraStatus("idle");
              setCameraMode(m => !m);
            }}
            className="rhei-press"
            style={{
              background: cameraMode
                ? "rgba(228,195,138,0.14)"
                : "rgba(248,242,229,0.05)",
              border: `1px solid ${cameraMode ? "rgba(228,195,138,0.40)" : "rgba(248,242,229,0.14)"}`,
              borderRadius: 100,
              padding: "9px 18px",
              cursor: "pointer",
              color: cameraMode ? "#F2D9A6" : "rgba(248,242,229,0.78)",
              fontSize: 11,
              fontFamily: SF,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              boxShadow: cameraMode ? "0 4px 16px rgba(228,195,138,0.18)" : "none",
            }}>
            <Camera size={12} strokeWidth={1.7}/>
            {cameraStatus === "denied"
              ? "Re-enable camera"
              : cameraMode
                ? "Back to portrait"
                : "Do it on my face"}
          </button>
        )}

        {/* Instruction */}
        <h3 style={{fontSize:20,color:B.cream,fontWeight:400,fontFamily:F,marginBottom:8,textAlign:"center"}}>{currentStep.title}</h3>
        {currentStep.direction && <p style={{fontSize:11,color:B.gold,fontFamily:SF,margin:"0 0 12px",background:`${B.gold}12`,padding:"4px 12px",borderRadius:20,letterSpacing:1}}>{currentStep.direction}</p>}
        <p style={{fontSize:13,color:B.creamMuted,fontFamily:SF,lineHeight:1.6,textAlign:"center",maxWidth:320,margin:"0 0 28px"}}>{currentStep.instruction}</p>

        {/* Controls */}
        <div style={{display:"flex",gap:12,marginTop:"auto"}}>
          {step > 0 && <button onClick={prevStep} style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:28,padding:"12px 24px",cursor:"pointer",color:B.cream,fontSize:12,fontFamily:SF}}>Previous</button>}
          <button onClick={timeLeft<=0?nextStep:()=>{clearInterval(timerRef.current);nextStep();}} style={{background:timeLeft<=0?B.goldGrad:B.card,border:timeLeft<=0?"none":`1px solid ${B.border}`,borderRadius:28,padding:"12px 32px",cursor:"pointer",color:timeLeft<=0?B.warmBlack:B.cream,fontSize:13,fontFamily:SF,fontWeight:500,letterSpacing:0.5}}>
            {timeLeft<=0?(step+1>=totalSteps?"Finish":"Next Step"):"Skip →"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════
// GOLDEN-HOUR ATMOSPHERE
// ══════════════════════════════════
// Reusable cinematic light stack used on every full-screen surface.
// Composes: ember core, sun bloom, deep haze, god rays, drifting dust,
// edge vignette, film grain. Light DOMINATES the visible area; dark walnut
// is preserved at the edges as atmospheric containment.
//
// Tunable: light position (so each screen has its own light direction),
// intensity (0-1), and whether to render the particle layer (skip on
// dense content screens).
function GoldenHourAtmosphere({
  top = "34%", left = "50%",
  intensity = 1,
  particles = true,
  vignette = true,
}) {
  // Scale opacity values by intensity so it's easy to dial up/down per screen.
  const ember = 0.55 * intensity;
  const bloomCore = 0.42 * intensity;
  const bloomMid = 0.22 * intensity;
  const bloomEdge = 0.10 * intensity;
  const haze = 0.20 * intensity;
  return (
    <>
      {/* Ember core — brightest hot point */}
      <div style={{
        position:"absolute", top, left,
        width:"42vmin", height:"42vmin", borderRadius:"50%",
        background:`radial-gradient(circle, rgba(245,216,154,${ember}) 0%, rgba(232,192,136,${ember*0.55}) 30%, transparent 65%)`,
        filter:"blur(22px)",
        transform:"translate(-50%, -50%)",
        animation:"rhei-ember 14s ease-in-out infinite",
        pointerEvents:"none", mixBlendMode:"screen",
      }}/>
      {/* Sun bloom — large warm halo */}
      <div style={{
        position:"absolute", top, left,
        width:"145vmin", height:"145vmin", borderRadius:"50%",
        background:`radial-gradient(circle, rgba(232,192,136,${bloomCore}) 0%, rgba(212,173,106,${bloomMid}) 22%, rgba(196,154,75,${bloomEdge}) 42%, rgba(196,154,75,${bloomEdge*0.3}) 60%, transparent 75%)`,
        filter:"blur(32px)",
        transform:"translate(-50%, -50%)",
        animation:"rhei-atmosphere-1 22s ease-in-out infinite",
        pointerEvents:"none", mixBlendMode:"screen",
      }}/>
      {/* Counter haze — deeper amber, opposite corner */}
      <div style={{
        position:"absolute", top:"82%", left:"22%",
        width:"110vmin", height:"110vmin", borderRadius:"50%",
        background:`radial-gradient(circle, rgba(184,137,64,${haze}) 0%, rgba(160,125,58,${haze*0.4}) 35%, transparent 65%)`,
        filter:"blur(50px)",
        transform:"translate(-50%, -50%)",
        animation:"rhei-atmosphere-2 32s ease-in-out infinite",
        pointerEvents:"none", mixBlendMode:"screen",
      }}/>
      {/* God rays — two soft diagonal shafts */}
      <div style={{
        position:"absolute", inset:0,
        background:`
          linear-gradient(108deg, transparent 38%, rgba(232,192,136,${0.10*intensity}) 50%, transparent 60%),
          linear-gradient(118deg, transparent 42%, rgba(245,216,154,${0.07*intensity}) 52%, transparent 58%)
        `,
        mixBlendMode:"screen", pointerEvents:"none", opacity:0.85,
      }}/>
      {/* Drifting golden dust */}
      {particles && (
        <div style={{position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden"}}>
          {Array.from({length: 14}).map((_, i) => (
            <span key={i} style={{
              position:"absolute",
              left: `${(i * 7.3) % 100}%`,
              top: `${(i * 11.7 + 8) % 90}%`,
              width: 3 + (i%3), height: 3 + (i%3),
              borderRadius:"50%",
              background: i%2 ? `rgba(245,216,154,${0.55*intensity})` : `rgba(232,192,136,${0.40*intensity})`,
              filter:"blur(1.5px)",
              animation: `rhei-drift-${i%3} ${22 + (i%5)*3}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}/>
          ))}
        </div>
      )}
      {/* Edge vignette — frames the light */}
      {vignette && (
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(15,9,5,0.35) 72%, rgba(15,9,5,0.75) 100%)",
          pointerEvents:"none",
        }}/>
      )}
      {/* Film grain (always last) */}
      <div className="rhei-grain"/>
    </>
  );
}

// ══════════════════════════════════
// DRAMATIC GOD RAYS — Luminar-style streaming light from above
// Theatrical diagonal shafts piercing near-black void.
// Use for screens that need cinematic drama, not just warmth.
// ══════════════════════════════════
function DramaticGodRays({ intensity = 1, pierce = "50%" }) {
  // pierce = where the rays converge (x position, like a sun above the frame)
  return (
    <>
      {/* Deep void base wash — pulls eye to top */}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse 120% 70% at ${pierce} -10%, rgba(245,200,120,${0.42*intensity}) 0%, rgba(232,170,90,${0.22*intensity}) 18%, rgba(180,120,50,${0.10*intensity}) 38%, transparent 62%)`,
        pointerEvents:"none",
      }}/>

      {/* The pierce point — concentrated hot spot just above frame */}
      <div style={{
        position:"absolute", top:"-8%", left:pierce,
        width:"60vmin", height:"60vmin", borderRadius:"50%",
        background:`radial-gradient(circle, rgba(255,220,150,${0.65*intensity}) 0%, rgba(245,200,120,${0.40*intensity}) 18%, rgba(220,160,80,${0.18*intensity}) 38%, transparent 62%)`,
        filter:"blur(28px)",
        transform:"translateX(-50%)",
        animation:"rhei-ember 18s ease-in-out infinite",
        mixBlendMode:"screen", pointerEvents:"none",
      }}/>

      {/* Streaming diagonal shafts — multiple angles, varied width */}
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

      {/* Soft outer shafts — widest, lowest opacity (peripheral light) */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none", mixBlendMode:"screen",
        background:`
          linear-gradient(140deg, transparent 25%, rgba(245,200,120,${0.07*intensity}) 50%, transparent 75%),
          linear-gradient(225deg, transparent 25%, rgba(220,160,80,${0.06*intensity}) 50%, transparent 75%)
        `,
        filter:"blur(8px)",
      }}/>

      {/* Floor reaches — light spilling down toward bottom */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:"42%",
        background:`linear-gradient(180deg, transparent 0%, rgba(180,120,50,${0.06*intensity}) 60%, rgba(120,80,30,${0.10*intensity}) 100%)`,
        pointerEvents:"none", mixBlendMode:"screen",
      }}/>

      {/* Slow drifting motes — fewer than golden hour, like dust in a beam */}
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

      {/* Side vignette — pulls eye to center column, like a theatrical spotlight */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 70% 100% at 50% 50%, transparent 30%, rgba(8,5,2,0.40) 75%, rgba(8,5,2,0.85) 100%)",
      }}/>

      {/* Film grain */}
      <div className="rhei-grain"/>
    </>
  );
}

// ══════════════════════════════════
// MINIMAL STARBURST — tiny gold icon (like the Luminar reference)
// ══════════════════════════════════
function Starburst({ size = 28, color = "#F5C878" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2 L17.2 13.4 L28 14.8 L17.2 16.6 L16 30 L14.8 16.6 L4 14.8 L14.8 13.4 Z" fill={color} opacity="0.95"/>
      <path d="M16 6 L16.6 13.8 L24 14.8 L16.6 15.8 L16 26 L15.4 15.8 L8 14.8 L15.4 13.8 Z" fill="#FFE4B0" opacity="0.7"/>
    </svg>
  );
}

// ══════════════════════════════════
// ONBOARDING COMPONENT
// ══════════════════════════════════
function Onboarding({ onComplete, authUser }) {
  const [name,setName]=useState("");
  // step: "splash" | "email" | "linkSent" | 0 | 1 | 2 | 3
  // 0-2 are the existing explainer screens, 3 is the name input
  // If user is already authenticated (returning from magic link), skip the splash/email steps
  const [step,setStep]=useState(() => (authUser ? 0 : "splash"));
  const [email,setEmail]=useState("");
  const [authError,setAuthError]=useState("");
  const [authLoading,setAuthLoading]=useState(false);
  const [authMode,setAuthMode]=useState("signup"); // "signup" or "signin"
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [resetSent,setResetSent]=useState(false);

  // Advance to explainer screens once the user is signed in
  useEffect(() => {
    if (authUser && (step === "splash" || step === "email" || step === "linkSent")) {
      setStep(0);
    }
  }, [authUser]);

  // Direct sign-up / sign-in with email + password. No magic link, no
  // redirect to Gmail. The Supabase welcome email arrives in the background
  // while the user is already inside the app.
  const handleAuth = async () => {
    const e = email.trim().toLowerCase();
    const pw = password;
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setAuthError("That email doesn't look right. Try again.");
      return;
    }
    if (pw.length < 6) {
      setAuthError("Choose a password of at least 6 characters.");
      return;
    }
    setAuthError("");

    // ── Local-only fallback (Supabase not configured) ──
    if (!supabaseEnabled) {
      try {
        localStorage.setItem("rhei_local_email", e);
        localStorage.setItem("rhei_local_account_created_at", String(Date.now()));
        localStorage.setItem("rhei_local_account_active", "1");
      } catch {}
      setStep(0);
      return;
    }

    setAuthLoading(true);
    try {
      let result;
      if (authMode === "signup") {
        // Hits our Edge Function `signup-confirmed` which uses the service
        // role to create the user with email_confirm: true so they can sign
        // in immediately — no Gmail redirect, no confirmation link. If the
        // function fails (e.g. cold start), fall back to standard signUp.
        try {
          const fnUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://qtrzvxlhaegwlufmnpwc.supabase.co'}/functions/v1/signup-confirmed`;
          const fnRes = await fetch(fnUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: e, password: pw }),
          });
          if (!fnRes.ok) {
            const body = await fnRes.json().catch(() => ({}));
            const msg = String(body?.error || "").toLowerCase();
            if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
              // Account exists → try signing them in with the provided pw
              result = await supabase.auth.signInWithPassword({ email: e, password: pw });
            } else {
              // Unknown failure → fall back to standard signUp
              result = await supabase.auth.signUp({
                email: e,
                password: pw,
                options: { emailRedirectTo: window.location.origin },
              });
            }
          } else {
            // Account created + auto-confirmed. Sign them in now to get a session.
            result = await supabase.auth.signInWithPassword({ email: e, password: pw });
          }
        } catch (_fnErr) {
          // Network blip on the Edge Function — fall back gracefully
          result = await supabase.auth.signUp({
            email: e,
            password: pw,
            options: { emailRedirectTo: window.location.origin },
          });
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email: e, password: pw });
      }
      const { data, error } = result;
      if (error) {
        // Surface common errors with human copy
        const msg = String(error.message || "").toLowerCase();
        if (msg.includes("already") && msg.includes("registered")) {
          setAuthError("This email is already registered. Try signing in instead.");
        } else if (msg.includes("invalid") && (msg.includes("credentials") || msg.includes("password"))) {
          setAuthError("That email and password don't match. Try again.");
        } else if (msg.includes("email not confirmed")) {
          setAuthError("Confirm your email first — check your inbox for the link.");
        } else {
          setAuthError(error.message || "Couldn't sign in. Try again.");
        }
      } else if (data?.session) {
        // Signed in immediately — onAuthStateChange in the parent will
        // detect this and advance the onboarding step.
        setStep(0);
      } else if (data?.user && !data.session) {
        // Sign-up succeeded but confirmation is required. We still let the
        // user continue into the app locally; they can confirm by email
        // anytime to enable cross-device sign-in.
        try {
          localStorage.setItem("rhei_local_email", e);
          localStorage.setItem("rhei_local_account_active", "1");
        } catch {}
        setStep(0);
      } else {
        setStep(0);
      }
    } catch (err) {
      setAuthError("Connection issue. Try again in a moment.");
    }
    setAuthLoading(false);
  };

  const handleForgotPassword = async () => {
    const e = email.trim().toLowerCase();
    if (!e) {
      setAuthError("Enter your email above and tap reset again.");
      return;
    }
    if (!supabaseEnabled) {
      setAuthError("Password reset needs an online account. Continue without one for now.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: window.location.origin,
      });
      if (error) setAuthError(error.message || "Couldn't send reset. Try again.");
      else setResetSent(true);
    } catch {
      setAuthError("Connection issue. Try again in a moment.");
    }
    setAuthLoading(false);
  };

  // ── Welcome splash ──
  if (step === "splash") {
    return (
      <div style={{
        position:"fixed",inset:0,zIndex:200,
        background:`linear-gradient(180deg, #2D1B0E 0%, #1A0F06 60%, #0F0905 100%)`,
        overflow:"hidden",
      }}>
        {/* Cinematic golden-hour stack — dark walnut room at sunset */}
        <GoldenHourAtmosphere top="34%" left="50%" intensity={1} />

        {/* Content */}
        <div style={{
          position:"relative", zIndex:1,
          height:"100%",
          display:"flex", flexDirection:"column",
          padding:"calc(env(safe-area-inset-top, 0px) + 56px) 28px calc(env(safe-area-inset-bottom, 0px) + 40px)",
        }}>
          {/* Top eyebrow — tiny, kerned, atmospheric */}
          <div className="rhei-rise rhei-rise-1" style={{textAlign:"center"}}>
            <p style={{
              fontFamily:SF, fontSize:10, fontWeight:500,
              letterSpacing:"0.32em", textTransform:"uppercase",
              color:"rgba(248,242,229,0.7)",
              margin:0,
              textShadow:"0 1px 8px rgba(0,0,0,0.6)",
            }}>A nervous system practice</p>
          </div>

          {/* Spacer to push wordmark + tagline to lower-mid composition */}
          <div style={{flex:1}}/>

          {/* Wordmark + tagline — the hero composition */}
          <div className="rhei-rise rhei-rise-2" style={{textAlign:"center", marginBottom:"auto"}}>
            <h1 style={{
              fontFamily:F, fontSize:"clamp(72px, 22vw, 112px)", fontWeight:300,
              color:B.vellum, letterSpacing:"-0.025em", lineHeight:0.92,
              margin:0,
              textShadow:"0 4px 32px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.4)",
              fontVariationSettings:"'opsz' 144, 'SOFT' 30",
            }}>Rhei.</h1>
            <p style={{
              fontFamily:F, fontSize:16, fontWeight:400,
              color:"rgba(248,242,229,0.85)",
              letterSpacing:"0.02em", lineHeight:1.5,
              margin:"22px auto 0", maxWidth:280,
              textShadow:"0 2px 12px rgba(0,0,0,0.55)",
            }}>Return to yourself.</p>
          </div>

          {/* CTAs — bottom anchor */}
          <div className="rhei-rise rhei-rise-4" style={{display:"flex", flexDirection:"column", alignItems:"center", gap:14}}>
            <button
              className="rhei-press"
              onClick={()=>{setAuthMode("signup");setStep("email");}}
              style={{
                width:"100%", maxWidth:340,
                background:B.paper,
                border:"none", borderRadius:100, padding:"18px 24px",
                cursor:"pointer", color:B.espresso,
                fontFamily:SF, fontSize:14, fontWeight:500,
                letterSpacing:"0.04em",
                boxShadow:"0 20px 60px -20px rgba(248,242,229,0.35), 0 8px 20px rgba(15,9,5,0.5)",
              }}>
              Enter
            </button>

            <button
              className="rhei-press"
              onClick={()=>{setAuthMode("signin");setStep("email");}}
              style={{
                background:"none", border:"none", cursor:"pointer",
                color:"rgba(248,242,229,0.78)",
                fontFamily:SF, fontSize:13, fontWeight:400,
                letterSpacing:"0.04em",
                padding:"10px 18px",
                textShadow:"0 1px 8px rgba(0,0,0,0.5)",
              }}>
              I have an account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Email entry ──
  if (step === "email") {
    const isSignup = authMode === "signup";
    return (
      <div style={{
        position:"fixed",inset:0,zIndex:200,
        background:`linear-gradient(180deg, #2D1B0E 0%, #1A0F06 60%, #0F0905 100%)`,
        overflow:"hidden",
      }}>
        <GoldenHourAtmosphere top="24%" left="50%" intensity={0.88} />

        {/* Back chevron */}
        <button
          className="rhei-press"
          onClick={()=>{setStep("splash");setAuthError("");}}
          style={{
            position:"absolute", top:"calc(env(safe-area-inset-top, 0px) + 22px)", left:22,
            background:"none", border:"none", cursor:"pointer",
            color:"rgba(248,242,229,0.65)",
            fontFamily:SF, fontSize:11, fontWeight:400, letterSpacing:"0.18em", textTransform:"uppercase",
            padding:8, display:"flex", alignItems:"center", gap:6, zIndex:2,
          }}>
          <ChevronLeft size={13}/> Back
        </button>

        {/* Content */}
        <div style={{
          position:"relative", zIndex:1,
          height:"100%",
          display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
          padding:"56px 28px",
        }}>
          <div style={{maxWidth:420, width:"100%", textAlign:"center"}}>
            <p className="rhei-rise rhei-rise-1" style={{
              fontFamily:SF, fontSize:10, fontWeight:500,
              letterSpacing:"0.32em", textTransform:"uppercase",
              color:"rgba(196,154,75,0.85)",
              margin:"0 0 28px",
            }}>{isSignup ? "Begin" : "Continue"}</p>

            <h2 className="rhei-rise rhei-rise-2" style={{
              fontFamily:F, fontSize:"clamp(34px, 9vw, 44px)", fontWeight:300,
              color:B.vellum, letterSpacing:"-0.015em", lineHeight:1.08,
              margin:"0 0 18px",
              fontVariationSettings:"'opsz' 60",
            }}>
              {isSignup ? "Tell me where to find you." : "Welcome back."}
            </h2>

            <p className="rhei-rise rhei-rise-3" style={{
              fontFamily:F, fontSize:15, fontWeight:400,
              color:"rgba(248,242,229,0.7)",
              lineHeight:1.55,
              margin:"0 auto 44px", maxWidth:300,
            }}>{
              isSignup
                ? (supabaseEnabled ? "Email and a password. That's it." : "Saved to this device.")
                : (supabaseEnabled ? "Welcome back." : "The email you set up with.")
            }</p>

            {/* Email + password — direct sign-up, no magic link redirect */}
            <div className="rhei-rise rhei-rise-4" style={{maxWidth:360, margin:"0 auto", display:"flex", flexDirection:"column", gap:12}}>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")handleAuth();}}
                placeholder="you@yours.com"
                autoFocus
                autoComplete="email"
                disabled={authLoading}
                style={{
                  width:"100%",
                  background:"rgba(248,242,229,0.04)",
                  backdropFilter:"blur(20px) saturate(1.2)",
                  WebkitBackdropFilter:"blur(20px) saturate(1.2)",
                  border:`1px solid ${email ? "rgba(196,154,75,0.45)" : "rgba(248,242,229,0.10)"}`,
                  borderRadius:100,
                  padding:"17px 26px",
                  color:B.vellum,
                  fontSize:16, fontFamily:F, fontStyle:email?"normal":"italic",
                  outline:"none", textAlign:"center",
                  boxSizing:"border-box",
                  transition:"border-color 0.4s var(--rhei-ease)",
                }}
              />
              {supabaseEnabled && (
                <div style={{position:"relative"}}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")handleAuth();}}
                    placeholder={isSignup ? "create a password" : "your password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    disabled={authLoading}
                    style={{
                      width:"100%",
                      background:"rgba(248,242,229,0.04)",
                      backdropFilter:"blur(20px) saturate(1.2)",
                      WebkitBackdropFilter:"blur(20px) saturate(1.2)",
                      border:`1px solid ${password ? "rgba(196,154,75,0.45)" : "rgba(248,242,229,0.10)"}`,
                      borderRadius:100,
                      padding:"17px 50px 17px 26px",
                      color:B.vellum,
                      fontSize:16, fontFamily:F, fontStyle:password?"normal":"italic",
                      outline:"none", textAlign:"center",
                      boxSizing:"border-box",
                      transition:"border-color 0.4s var(--rhei-ease)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={()=>setShowPassword(s=>!s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position:"absolute", right:18, top:"50%", transform:"translateY(-50%)",
                      background:"none", border:"none", cursor:"pointer",
                      color:"rgba(248,242,229,0.55)", padding:6,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              )}
            </div>

            {/* Mode toggle + forgot password */}
            {supabaseEnabled && (
              <div className="rhei-rise rhei-rise-4" style={{maxWidth:360, margin:"14px auto 0", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10}}>
                <button
                  type="button"
                  onClick={()=>{setAuthMode(isSignup?"signin":"signup"); setAuthError(""); setResetSent(false);}}
                  style={{
                    background:"none", border:"none", cursor:"pointer",
                    color:"rgba(248,242,229,0.6)",
                    fontFamily:SF, fontSize:11, padding:"6px 0",
                  }}>
                  {isSignup ? "I have an account" : "Create an account"}
                </button>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={authLoading}
                    style={{
                      background:"none", border:"none", cursor:"pointer",
                      color:"rgba(196,154,75,0.78)",
                      fontFamily:SF, fontSize:11, padding:"6px 0",
                    }}>
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {authError && (
              <p style={{fontSize:13, color:B.rouge, fontFamily:F, margin:"16px auto 0", maxWidth:300, lineHeight:1.5}}>{authError}</p>
            )}
            {resetSent && (
              <p style={{fontSize:13, color:B.gold, fontFamily:F, fontStyle:"italic", margin:"16px auto 0", maxWidth:300, lineHeight:1.5}}>
                A reset link is on its way to your inbox.
              </p>
            )}

            <div className="rhei-rise rhei-rise-5" style={{marginTop:22, display:"flex", flexDirection:"column", alignItems:"center", gap:14}}>
              <button
                className="rhei-press"
                onClick={handleAuth}
                disabled={!email.trim() || (supabaseEnabled && !password) || authLoading}
                style={{
                  width:"100%", maxWidth:360,
                  background: (email.trim() && (!supabaseEnabled || password) && !authLoading) ? B.paper : "rgba(248,242,229,0.10)",
                  border:"none", borderRadius:100, padding:"18px 24px",
                  cursor: (email.trim() && (!supabaseEnabled || password) && !authLoading) ? "pointer" : "not-allowed",
                  color: (email.trim() && (!supabaseEnabled || password) && !authLoading) ? B.espresso : "rgba(248,242,229,0.4)",
                  fontFamily:SF, fontSize:14, fontWeight:500, letterSpacing:"0.04em",
                  boxShadow: (email.trim() && (!supabaseEnabled || password) && !authLoading) ? "0 16px 48px -16px rgba(248,242,229,0.3), 0 6px 16px rgba(15,9,5,0.5)" : "none",
                  opacity: authLoading ? 0.6 : 1,
                  transition:"all 0.4s var(--rhei-ease)",
                }}>
                {authLoading
                  ? (isSignup ? "Creating your account…" : "Signing you in…")
                  : supabaseEnabled
                    ? (isSignup ? "Create my account" : "Sign in")
                    : "Continue"}
              </button>

              <button
                className="rhei-press"
                onClick={()=>setStep(0)}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  color:"rgba(248,242,229,0.5)",
                  fontFamily:SF, fontSize:11, fontWeight:400,
                  letterSpacing:"0.18em", textTransform:"uppercase",
                  padding:8,
                }}>
                I'll come back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Magic link sent confirmation ──
  if (step === "linkSent") {
    return (
      <div style={{
        position:"fixed",inset:0,zIndex:200,
        background:`linear-gradient(180deg, #2D1B0E 0%, #1A0F06 60%, #0F0905 100%)`,
        overflow:"hidden",
      }}>
        <GoldenHourAtmosphere top="38%" left="50%" intensity={0.92} />

        <div style={{
          position:"relative", zIndex:1,
          height:"100%",
          display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
          padding:"56px 28px", textAlign:"center",
        }}>
          <div style={{maxWidth:420, width:"100%"}}>
            <p className="rhei-rise rhei-rise-1" style={{
              fontFamily:SF, fontSize:10, fontWeight:500,
              letterSpacing:"0.32em", textTransform:"uppercase",
              color:"rgba(196,154,75,0.85)",
              margin:"0 0 28px",
            }}>Sent</p>

            <h2 className="rhei-rise rhei-rise-2" style={{
              fontFamily:F, fontSize:"clamp(34px, 9vw, 44px)", fontWeight:300,
              color:B.vellum, letterSpacing:"-0.015em", lineHeight:1.08,
              margin:"0 0 22px",
              fontVariationSettings:"'opsz' 60",
            }}>Check your inbox.</h2>

            <p className="rhei-rise rhei-rise-3" style={{
              fontFamily:F, fontSize:15, fontWeight:400,
              color:"rgba(248,242,229,0.7)",
              lineHeight:1.6,
              margin:"0 auto 14px", maxWidth:340,
            }}>
              The link is on its way to <span style={{color:B.vellum, fontStyle:"normal"}}>{email}</span>.
            </p>
            <p className="rhei-rise rhei-rise-3" style={{
              fontFamily:F, fontSize:13, fontWeight:400,
              color:"rgba(248,242,229,0.5)",
              lineHeight:1.6,
              margin:"0 auto 44px", maxWidth:320,
            }}>Open it here when it arrives.</p>

            <div className="rhei-rise rhei-rise-4" style={{display:"flex", flexDirection:"column", alignItems:"center", gap:14}}>
              <button
                className="rhei-press"
                onClick={()=>{setStep("email");setAuthError("");}}
                style={{
                  background:"rgba(248,242,229,0.04)",
                  backdropFilter:"blur(20px) saturate(1.2)",
                  WebkitBackdropFilter:"blur(20px) saturate(1.2)",
                  border:"1px solid rgba(248,242,229,0.10)", borderRadius:100,
                  padding:"14px 26px", cursor:"pointer",
                  color:B.paper,
                  fontFamily:SF, fontSize:13, fontWeight:400, letterSpacing:"0.04em",
                }}>
                Try another email
              </button>

              <button
                className="rhei-press"
                onClick={()=>setStep(0)}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  color:"rgba(248,242,229,0.5)",
                  fontFamily:SF, fontSize:11, fontWeight:400,
                  letterSpacing:"0.18em", textTransform:"uppercase",
                  padding:8,
                }}>
                Browse first
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Explainer screens (steps 0, 1, 2) — three declarative moments, not a tutorial.
  // Each screen is one statement. The body line either expands or contradicts it.
  // Voice: Joan Didion meets Phoebe Philo. No instructions, no marketing.
  const explainerSteps = [
    {
      numeral: "I",
      heading: "There is nothing to fix.",
      body: "This is not a goal. It's a place to come back to.",
    },
    {
      numeral: "II",
      heading: "Your face is the surface of your nervous system.",
      body: "Working with the surface is one of the fastest ways to settle what's underneath.",
    },
    {
      numeral: "III",
      heading: "Take what you need. Leave the rest.",
      body: "Open it when something is too much. Close it when something is enough.",
    },
  ];

  if (step <= 2) {
    const s = explainerSteps[step];
    // Light position shifts per step so the room "rotates" with the user's progress
    const lightTop  = step === 0 ? "28%" : step === 1 ? "42%" : "58%";
    const lightLeft = step === 1 ? "68%" : "50%";
    return (
      <div style={{
        position:"fixed",inset:0,zIndex:200,
        background:`linear-gradient(180deg, #2D1B0E 0%, #1A0F06 60%, #0F0905 100%)`,
        overflow:"hidden",
      }}>
        <GoldenHourAtmosphere top={lightTop} left={lightLeft} intensity={0.95} />

        {/* Skip — discreet, top-right */}
        <button
          className="rhei-press"
          onClick={()=>setStep(3)}
          style={{
            position:"absolute", top:"calc(env(safe-area-inset-top, 0px) + 22px)", right:22,
            background:"none", border:"none", cursor:"pointer",
            color:"rgba(248,242,229,0.45)",
            fontFamily:SF, fontSize:10, fontWeight:400,
            letterSpacing:"0.22em", textTransform:"uppercase",
            padding:8, zIndex:2,
          }}>
          Skip
        </button>

        {/* Content */}
        <div key={step} style={{
          position:"relative", zIndex:1,
          height:"100%",
          display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
          padding:"56px 28px", textAlign:"center",
        }}>
          <div style={{maxWidth:480, width:"100%"}}>
            {/* Numeral — large, Fraunces, low-opacity, atmospheric */}
            <p key={`n-${step}`} className="rhei-rise rhei-rise-1" style={{
              fontFamily:F, 
              fontSize:14, fontWeight:400,
              color:"rgba(196,154,75,0.7)",
              letterSpacing:"0.08em",
              margin:"0 0 56px",
            }}>{s.numeral}</p>

            {/* Heading — the statement */}
            <h2 key={`h-${step}`} className="rhei-rise rhei-rise-2" style={{
              fontFamily:F, fontSize:"clamp(30px, 8vw, 42px)", fontWeight:300,
              color:B.vellum, letterSpacing:"-0.015em", lineHeight:1.12,
              margin:"0 0 28px",
              maxWidth:460,
              fontVariationSettings:"'opsz' 60",
            }}>{s.heading}</h2>

            {/* Body — the breath after */}
            <p key={`b-${step}`} className="rhei-rise rhei-rise-3" style={{
              fontFamily:F, fontSize:16, fontWeight:400,
              color:"rgba(248,242,229,0.62)",
              lineHeight:1.55,
              margin:"0 auto 64px", maxWidth:380,
            }}>{s.body}</p>

            {/* Progress — hairline marks, not dots */}
            <div className="rhei-rise rhei-rise-4" style={{display:"flex", justifyContent:"center", gap:8, marginBottom:48}}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: i === step ? 32 : 12,
                  height: 1,
                  background: i === step ? B.polished : i < step ? "rgba(212,173,106,0.5)" : "rgba(248,242,229,0.18)",
                  transition: "width 0.6s var(--rhei-ease), background 0.6s var(--rhei-ease)",
                }}/>
              ))}
            </div>

            {/* CTA — Paper button, the brand's primary surface */}
            <div className="rhei-rise rhei-rise-5" style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12}}>
              <button
                className="rhei-press"
                onClick={()=>setStep(step+1)}
                style={{
                  width:"100%", maxWidth:320,
                  background:B.paper,
                  border:"none", borderRadius:100, padding:"17px 24px",
                  cursor:"pointer", color:B.espresso,
                  fontFamily:SF, fontSize:14, fontWeight:500, letterSpacing:"0.04em",
                  boxShadow:"0 16px 48px -16px rgba(248,242,229,0.25), 0 6px 16px rgba(15,9,5,0.5)",
                }}>
                {step === 2 ? "Begin" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: name input — the threshold moment
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      background:`linear-gradient(180deg, #2D1B0E 0%, #1A0F06 60%, #0F0905 100%)`,
      overflow:"hidden",
    }}>
      <GoldenHourAtmosphere top="52%" left="50%" intensity={0.95} />

      <div style={{
        position:"relative", zIndex:1,
        height:"100%",
        display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
        padding:"56px 28px", textAlign:"center",
      }}>
        <div style={{maxWidth:420, width:"100%"}}>
          <p className="rhei-rise rhei-rise-1" style={{
            fontFamily:SF, fontSize:10, fontWeight:500,
            letterSpacing:"0.32em", textTransform:"uppercase",
            color:"rgba(196,154,75,0.85)",
            margin:"0 0 28px",
          }}>One more thing</p>

          <h2 className="rhei-rise rhei-rise-2" style={{
            fontFamily:F, fontSize:"clamp(34px, 9vw, 44px)", fontWeight:300,
            color:B.vellum, letterSpacing:"-0.015em", lineHeight:1.1,
            margin:"0 0 18px",
            fontVariationSettings:"'opsz' 60",
          }}>What should I call you?</h2>

          <p className="rhei-rise rhei-rise-3" style={{
            fontFamily:F, fontSize:15, fontWeight:400,
            color:"rgba(248,242,229,0.65)",
            lineHeight:1.55,
            margin:"0 auto 44px", maxWidth:300,
          }}>This stays between us.</p>

          <div className="rhei-rise rhei-rise-4" style={{position:"relative", maxWidth:360, margin:"0 auto"}}>
            <input
              type="text"
              value={name}
              onChange={e=>setName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter" && name.trim()){save('userName',name.trim());onComplete(name.trim());}}}
              placeholder="Your name"
              autoFocus
              style={{
                width:"100%",
                background:"rgba(248,242,229,0.04)",
                backdropFilter:"blur(20px) saturate(1.2)",
                WebkitBackdropFilter:"blur(20px) saturate(1.2)",
                border:`1px solid ${name ? "rgba(196,154,75,0.45)" : "rgba(248,242,229,0.10)"}`,
                borderRadius:100,
                padding:"17px 26px",
                color:B.vellum,
                fontSize:16, fontFamily:F, fontStyle:name?"normal":"italic",
                outline:"none", textAlign:"center",
                boxSizing:"border-box",
                transition:"border-color 0.4s var(--rhei-ease), background 0.4s var(--rhei-ease)",
              }}
            />
          </div>

          <div className="rhei-rise rhei-rise-5" style={{marginTop:20, display:"flex", flexDirection:"column", alignItems:"center", gap:14}}>
            <button
              className="rhei-press"
              onClick={()=>{if(name.trim()){save('userName',name.trim());onComplete(name.trim());}}}
              disabled={!name.trim()}
              style={{
                width:"100%", maxWidth:360,
                background: name.trim() ? B.paper : "rgba(248,242,229,0.10)",
                border:"none", borderRadius:100, padding:"18px 24px",
                cursor: name.trim() ? "pointer" : "not-allowed",
                color: name.trim() ? B.espresso : "rgba(248,242,229,0.4)",
                fontFamily:SF, fontSize:14, fontWeight:500, letterSpacing:"0.04em",
                boxShadow: name.trim() ? "0 16px 48px -16px rgba(248,242,229,0.3), 0 6px 16px rgba(15,9,5,0.5)" : "none",
                transition:"all 0.4s var(--rhei-ease)",
              }}>
              Enter
            </button>

            <button
              className="rhei-press"
              onClick={()=>{save('userName','');onComplete('');}}
              style={{
                background:"none", border:"none", cursor:"pointer",
                color:"rgba(248,242,229,0.5)",
                fontFamily:SF, fontSize:11, fontWeight:400,
                letterSpacing:"0.18em", textTransform:"uppercase",
                padding:8,
              }}>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════
// MAIN APP COMPONENT
// ══════════════════════════════════
export default function ObrizApp() {
  // Onboarding
  const [onboarded,setOnboarded]=useState(()=>load('onboarded',false));
  const [userName,setUserName]=useState(()=>load('userName',''));
  const [isPremium,setIsPremium]=useState(()=>load('isPremium',false));

  // ── Free trial ──
  // 14-day full-access trial. Morning Reset stays free forever; everything
  // else unlocks during trial, locks again when trial expires + user hasn't paid.
  // Aligns with Stripe-side TRIAL_DAYS_MONTHLY = 14 in create-checkout-session.js
  const TRIAL_DAYS = 14;
  const [trialStartedAt,setTrialStartedAt]=useState(()=>load('trialStartedAt',null));

  // Initialize trial start for non-Supabase (guest/offline) mode only.
  // When Supabase is enabled, trial_started_at comes from the profiles table
  // after sign-in — we do not auto-grant a trial to unauthenticated visitors.
  useEffect(() => {
    if (supabase) return; // Supabase users get trial from the DB
    if (!trialStartedAt) {
      const now = Date.now();
      setTrialStartedAt(now);
      save('trialStartedAt', now);
    }
  }, [trialStartedAt]);

  const trialMsLeft = trialStartedAt
    ? Math.max(0, (trialStartedAt + TRIAL_DAYS * 24 * 60 * 60 * 1000) - Date.now())
    : TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const trialDaysLeft = Math.ceil(trialMsLeft / (24 * 60 * 60 * 1000));
  const isInTrial = trialMsLeft > 0;
  const trialEnded = trialStartedAt && trialMsLeft === 0 && !isPremium;
  // hasAccess: paid subscriber OR currently inside the trial window.
  // When Supabase is enabled, an unauthenticated visitor has no trial —
  // they must sign in to get their account-bound 14-day access.
  const hasAccess = isPremium || (supabase ? (!!authUser && isInTrial) : isInTrial);

  // Navigation
  const [screen,setScreen]=useState("home");
  const [prevScreen,setPrevScreen]=useState(null); // tracks where user came from for back navigation
  // The House sheet (plan management, profile, push, sign out). Opened from
  // the R. monogram in the top-right corner. Not a screen — a modal overlay.
  const [houseOpen,setHouseOpen]=useState(false);
  const [activeSession,setActiveSession]=useState(null);
  const [isPlaying,setIsPlaying]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [audioDuration,setAudioDuration]=useState(0);
  const [completedToday,setCompletedToday]=useState(()=>load('completedToday',[]));
  const [completedTodayDate,setCompletedTodayDate]=useState(()=>load('completedTodayDate',null));
  const [lastSessionDate,setLastSessionDate]=useState(()=>load('lastSessionDate',null));
  const [streak,setStreak]=useState(()=>load('streak',1));
  const [longestStreak,setLongestStreak]=useState(()=>load('longestStreak',1));
  const [streakHistory,setStreakHistory]=useState(()=>load('streakHistory',[]));
  const [totalSessions,setTotalSessions]=useState(()=>load('totalSessions',0));
  const [totalMinutes,setTotalMinutes]=useState(()=>load('totalMinutes',0));
  // Face check-in
  const [checkinState,setCheckinState]=useState(null);
  const [showCheckin,setShowCheckin]=useState(false);
  const [checkinDone,setCheckinDone]=useState(false);
  const [selectedCheckin,setSelectedCheckin]=useState(null);
  // Meditation check-in
  const [medCheckinState,setMedCheckinState]=useState(null);
  const [medCheckinDone,setMedCheckinDone]=useState(false);
  const [selectedMedCheckin,setSelectedMedCheckin]=useState(null);
  const [meditationStreak,setMeditationStreak]=useState(()=>load('meditationStreak',0));
  const [showComplete,setShowComplete]=useState(false);
  const [nsScore,setNsScore]=useState(()=>load('nsScore',50));
  const [scoreHistory,setScoreHistory]=useState(()=>load('scoreHistory',[45,42,48,52,55,50]));
  const [audioLoading,setAudioLoading]=useState(false);
  const [audioFailed,setAudioFailed]=useState(false);
  const [microActive,setMicroActive]=useState(null);
  const [microDone,setMicroDone]=useState(false);
  const [microMsg,setMicroMsg]=useState("");
  const [activeRitual,setActiveRitual]=useState(null);
  const [showInstallPrompt,setShowInstallPrompt]=useState(false);
  const [installDismissed,setInstallDismissed]=useState(()=>load('installDismissed',false));
  const [isIOS]=useState(()=>/iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isStandalone]=useState(()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true);
  const [checkoutLoading,setCheckoutLoading]=useState(false);
  const [portalLoading,setPortalLoading]=useState(false);

  // Auth state (Supabase)
  const [authUser,setAuthUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(!!supabase);
  const [authEmail,setAuthEmail]=useState('');
  const [authSent,setAuthSent]=useState(false);
  const [authError,setAuthError]=useState('');

  // Push notifications state
  // `pushStatus` cycles through: 'idle' | 'on' | 'off' | 'denied' | 'busy' | 'unsupported'
  const [pushStatus,setPushStatus]=useState(()=>{
    if (!pushSupported()) return 'unsupported';
    const p = notificationPermission();
    if (p === 'denied') return 'denied';
    return 'idle';
  });
  const [pushMsg,setPushMsg]=useState('');

  // ── Luxury toast + in-app modals (replaces native alert/prompt) ──
  // Toast is a single transient line of copy at bottom-center; modals are
  // full-screen overlays styled in the RHEI design language.
  const [toast,setToast]=useState(null); // { text: string } | null
  const toastTimerRef=useRef(null);
  const showToast=(text)=>{
    if(toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ text });
    toastTimerRef.current=setTimeout(()=>setToast(null),4200);
  };
  const [editingName,setEditingName]=useState(false);
  const [editingNameValue,setEditingNameValue]=useState('');
  const [showInstallHelp,setShowInstallHelp]=useState(false);

  const audioRef=useRef(null);
  const animRef=useRef(null);
  const deferredPromptRef=useRef(null);

  // PWA install prompt — show for both Android (beforeinstallprompt) and iOS (manual instructions)
  useEffect(()=>{
    if(isStandalone||installDismissed)return; // Already installed or dismissed
    const handler=(e)=>{e.preventDefault();deferredPromptRef.current=e;setShowInstallPrompt(true);};
    window.addEventListener('beforeinstallprompt',handler);
    // On iOS or if beforeinstallprompt doesn't fire within 2s, show manual install banner
    const timeout=setTimeout(()=>{if(!deferredPromptRef.current)setShowInstallPrompt(true);},2000);
    return()=>{window.removeEventListener('beforeinstallprompt',handler);clearTimeout(timeout);};
  },[isStandalone,installDismissed]);

  // Supabase auth listener
  useEffect(()=>{
    if(!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({data:{session}})=>{
      setAuthUser(session?.user||null);
      if(session?.user){
        const userId=session.user.id;
        const email=session.user.email;
        // Load trial start date from the profiles table (account-bound, device-agnostic)
        supabase.from('profiles').select('trial_started_at').eq('id',userId).single()
          .then(({data:profile})=>{
            if(profile?.trial_started_at){
              const ts=new Date(profile.trial_started_at).getTime();
              setTrialStartedAt(ts);
              save('trialStartedAt',ts);
            }
          })
          .catch(()=>{});
        if(email){
          // Check subscription status
          fetchWithRetry('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})
            .then(r=>r.json())
            .then(data=>{ if(data.isPremium){setIsPremium(true);save('isPremium',true);save('premiumPlan',data.plan);} })
            .catch(()=>{});
          save('customerEmail',email);
        }
        if(!userName && session.user.user_metadata?.name){setUserName(session.user.user_metadata.name);save('userName',session.user.user_metadata.name);}
      }
      setAuthLoading(false);
    });
    const {data:{subscription:authSub}}=supabase.auth.onAuthStateChange((_event,session)=>{
      setAuthUser(session?.user||null);
      if(session?.user){
        const userId=session.user.id;
        const email=session.user.email;
        // Load account-bound trial date on every sign-in event
        supabase.from('profiles').select('trial_started_at').eq('id',userId).single()
          .then(({data:profile})=>{
            if(profile?.trial_started_at){
              const ts=new Date(profile.trial_started_at).getTime();
              setTrialStartedAt(ts);
              save('trialStartedAt',ts);
            }
          })
          .catch(()=>{});
        if(email){
          fetchWithRetry('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})
            .then(r=>r.json())
            .then(data=>{ if(data.isPremium){setIsPremium(true);save('isPremium',true);} })
            .catch(()=>{});
          save('customerEmail',email);
        }
      } else {
        // Signed out — revoke in-memory trial access immediately
        setTrialStartedAt(null);
      }
    });
    return()=>authSub.unsubscribe();
  },[]);

  // Auth helpers
  const signInWithEmail=async()=>{
    if(!supabase||!authEmail.trim())return;
    setAuthError('');setAuthSent(false);
    try{
      const {error}=await supabase.auth.signInWithOtp({email:authEmail.trim(),options:{emailRedirectTo:window.location.origin}});
      if(error)setAuthError(error.message);
      else setAuthSent(true);
    }catch(e){setAuthError('Connection error. Try again.');}
  };
  const signOut=async()=>{
    if(!supabase)return;
    await supabase.auth.signOut();
    setAuthUser(null);
  };

  // Reflect whether the device is already subscribed to push (e.g. user
  // already opted in on a previous visit). Re-runs when sign-in changes.
  useEffect(()=>{
    if (!pushSupported()) { setPushStatus('unsupported'); return; }
    const p = notificationPermission();
    if (p === 'denied') { setPushStatus('denied'); return; }
    let cancelled = false;
    currentSubscription().then(sub => {
      if (cancelled) return;
      setPushStatus(sub ? 'on' : (p === 'granted' ? 'off' : 'idle'));
    });
    return () => { cancelled = true; };
  }, [authUser]);

  const togglePush = async () => {
    setPushMsg('');
    if (!pushSupported()) { setPushStatus('unsupported'); return; }
    if (!authUser) {
      setPushMsg('Sign in first so we can deliver to your account.');
      return;
    }
    setPushStatus('busy');
    if (pushStatus === 'on') {
      const res = await unsubscribeFromPush();
      if (res.ok) { setPushStatus('off'); setPushMsg('Notifications paused.'); }
      else { setPushStatus('on'); setPushMsg("Couldn't pause — try again."); }
      return;
    }
    const res = await subscribeToPush();
    if (res.ok) {
      setPushStatus('on');
      setPushMsg('You\u2019ll hear from us at the right moments.');
    } else if (res.reason === 'denied') {
      setPushStatus('denied');
      setPushMsg('Permission blocked. Enable it in your browser settings.');
    } else if (res.reason === 'not_signed_in') {
      setPushStatus('off');
      setPushMsg('Sign in first so we can deliver to your account.');
    } else if (res.reason === 'unsupported') {
      setPushStatus('unsupported');
    } else {
      setPushStatus('off');
      setPushMsg("Couldn't turn on right now. Try again in a moment.");
    }
  };

  // Stripe payment success detection
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const payment=params.get('payment');
    const sessionId=params.get('session_id');
    if(payment==='success'&&sessionId){
      // Verify the session with our API
      fetch('/api/verify-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId})})
        .then(r=>r.json())
        .then(data=>{
          if(data.verified){
            setIsPremium(true);save('isPremium',true);
            save('premiumPlan',data.plan);
            if(data.customer_email)save('customerEmail',data.customer_email);
          }
        })
        .catch(()=>{
          // Don't grant premium on verify failure — the URL parameter alone
          // is forgeable. If Stripe truly succeeded, the webhook will mark
          // the account premium server-side, and the next sign-in or the
          // "Restore access" button on the profile screen will pick it up.
          showToast("Confirming your purchase — your access will appear shortly.");
        });
      // Clean URL
      window.history.replaceState({},'','/');
    } else if(payment==='cancelled'){
      window.history.replaceState({},'','/');
    }
  },[]);

  // Stripe checkout handler
  const handleCheckout=async(plan)=>{
    trackEvent('subscribe_clicked', { plan });
    setCheckoutLoading(true);
    try{
      const userEmail=authUser?.email||load('customerEmail','');
      const res=await fetchWithRetry('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,email:userEmail||undefined})});
      const data=await res.json();
      if(data.url){window.location.href=data.url;}
      else{showToast("Checkout couldn't open. Tap subscribe to retry.");setCheckoutLoading(false);}
    }catch(err){
      showToast("Connection issue. Tap subscribe to retry.");setCheckoutLoading(false);
    }
  };

  // Stripe Customer Portal — cancel plan, switch monthly ↔ yearly, update card
  const openBillingPortal=async()=>{
    const userEmail=authUser?.email||load('customerEmail','');
    if(!userEmail){
      showToast("Sign in with the email used at checkout to manage your plan.");
      return;
    }
    setPortalLoading(true);
    try{
      const res=await fetchWithRetry('/api/create-portal-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:userEmail})});
      const data=await res.json();
      if(data.url){window.location.href=data.url;}
      else{showToast(data.error||"Couldn't open billing portal. Tap Manage Plan to retry.");setPortalLoading(false);}
    }catch(err){
      showToast("Connection issue. Tap Manage Plan to retry.");setPortalLoading(false);
    }
  };

  const installApp=async()=>{
    if(deferredPromptRef.current){deferredPromptRef.current.prompt();deferredPromptRef.current=null;setShowInstallPrompt(false);}
    else { setShowInstallHelp(true); }
  };
  const dismissInstall=()=>{setShowInstallPrompt(false);setInstallDismissed(true);save('installDismissed',true);};

  // ── Resilient fetch: silently retries on transient failures (network
  //    errors and 5xx). 4xx is a client problem and won't fix itself, so
  //    it returns immediately. The user only sees a toast if all attempts
  //    fail — meaning network blips and brief server hiccups are invisible.
  const fetchWithRetry = async (url, options = {}, maxRetries = 2) => {
    let lastErr;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await fetch(url, options);
        if (res.status >= 500 && attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        return res;
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }
    throw lastErr || new Error('fetch failed');
  };

  // ── Streak: real, date-based, consecutive-day logic.
  //    Call this from any session-completion site (meditation OR ritual).
  //    Same-day repeat sessions don't double-count. Coming back the next day
  //    extends the streak. A gap of more than one day resets it to 1.
  const recordSessionCompletion = () => {
    const today = todayStr();
    const yesterday = yesterdayOf(today);
    if (lastSessionDate === today) {
      // Already counted today — multiple sessions per day still count as 1
      return;
    }
    if (lastSessionDate === yesterday) {
      setMeditationStreak(n => n + 1);
    } else {
      // First session, or returning after a gap > 1 day
      setMeditationStreak(1);
    }
    setLastSessionDate(today);
    setCompletedTodayDate(today);
  };

  // Persist
  useEffect(()=>{save('completedToday',completedToday);},[completedToday]);
  useEffect(()=>{save('completedTodayDate',completedTodayDate);},[completedTodayDate]);
  useEffect(()=>{save('lastSessionDate',lastSessionDate);},[lastSessionDate]);
  useEffect(()=>{save('streak',streak);},[streak]);
  useEffect(()=>{save('meditationStreak',meditationStreak);},[meditationStreak]);

  // ── Daily rollover + one-time migration. Runs once per app open.
  //    1. Clear "completed today" if we crossed midnight since last open.
  //    2. Expire the streak if the user missed more than one full day.
  //    3. Migration: if lastSessionDate has never been set, the existing
  //       meditationStreak was computed under the old broken logic
  //       (per-session counter). Reset it so the streak starts clean
  //       on the next session.
  useEffect(()=>{
    const today = todayStr();
    if (completedTodayDate && completedTodayDate !== today) {
      setCompletedToday([]);
      setCompletedTodayDate(today);
    } else if (!completedTodayDate) {
      setCompletedTodayDate(today);
    }
    if (lastSessionDate === null) {
      // First time seeing the new streak logic — wipe any inflated legacy value.
      setMeditationStreak(0);
    } else if (lastSessionDate !== today && lastSessionDate !== yesterdayOf(today)) {
      // Gap of more than one day — streak broken.
      setMeditationStreak(0);
    }
  // Intentionally only run once per app open — checking again only matters
  // after a fresh load (PWAs reload state on relaunch).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{save('longestStreak',longestStreak);},[longestStreak]);
  useEffect(()=>{save('streakHistory',streakHistory);},[streakHistory]);
  // Keep longestStreak in sync if current streak exceeds it
  useEffect(()=>{if(streak>longestStreak)setLongestStreak(streak);if(meditationStreak>longestStreak)setLongestStreak(meditationStreak);},[streak,meditationStreak,longestStreak]);
  useEffect(()=>{save('totalSessions',totalSessions);},[totalSessions]);
  useEffect(()=>{save('totalMinutes',totalMinutes);},[totalMinutes]);
  useEffect(()=>{save('nsScore',nsScore);},[nsScore]);
  useEffect(()=>{save('scoreHistory',scoreHistory);},[scoreHistory]);
  useEffect(()=>{save('isPremium',isPremium);},[isPremium]);

  // Audio
  const trackTime=useCallback(()=>{if(audioRef.current&&!audioRef.current.paused){setElapsed(audioRef.current.currentTime);animRef.current=requestAnimationFrame(trackTime);}},[]);
  useEffect(()=>{return()=>{if(audioRef.current){audioRef.current.pause();audioRef.current.src='';}if(animRef.current)cancelAnimationFrame(animRef.current);};},[]);

  const startSession=(id)=>{
    const s=sessions.find(x=>x.id===id);
    trackEvent('meditation_started', { id: String(id), title: s?.title });
    setActiveSession(id);setElapsed(0);setIsPlaying(false);setShowComplete(false);setAudioLoading(true);setAudioFailed(false);setScreen("player");
    if(audioRef.current){audioRef.current.pause();audioRef.current.src='';}
    const a=new Audio(s.audioFile);a.preload='auto';audioRef.current=a;
    // Track retry attempts per audio instance (silent retry once, then user-facing retry)
    a._retries=0;
    a.addEventListener('loadedmetadata',()=>{setAudioDuration(a.duration);setAudioLoading(false);});
    a.addEventListener('canplay',()=>setAudioLoading(false));
    a.addEventListener('ended',()=>{
      cancelAnimationFrame(animRef.current);setIsPlaying(false);setElapsed(a.duration);
      if(!completedToday.includes(id)){
        setCompletedToday(c=>[...c,id]);setTotalSessions(t=>t+1);setTotalMinutes(t=>t+Math.ceil(s.duration/60));
        recordSessionCompletion();
        trackEvent('meditation_completed', { id: String(id), title: s.title });
        // Persist to Supabase (fire and forget via helper)
        completeSessionOnServer('meditation',null,Math.round(a.duration));
      }
      setShowComplete(true);
    });
    a.addEventListener('error',()=>{
      // First failure: silent retry. Lots of audio "errors" are just brief
      // network blips that resolve on a second load() call.
      if(a._retries < 1){
        a._retries++;
        setTimeout(()=>{ try{ a.load(); }catch{} }, 1500);
        return;
      }
      // Second failure: surface to the user. Play button transitions
      // to retry mode (see togglePlay) so a single tap restarts loading.
      setAudioLoading(false);
      setAudioFailed(true);
      showToast("Audio didn't load. Tap play to retry.");
    });
  };

  const togglePlay=()=>{
    // If the last audio load failed, the Play button is in "retry" mode —
    // a single tap restarts the entire session, which re-creates the Audio
    // element from scratch and clears audioFailed.
    if(audioFailed && activeSession){
      startSession(activeSession);
      return;
    }
    if(!audioRef.current)return;
    if(isPlaying){audioRef.current.pause();cancelAnimationFrame(animRef.current);setIsPlaying(false);}
    else{audioRef.current.play().then(()=>{setIsPlaying(true);animRef.current=requestAnimationFrame(trackTime);}).catch(()=>{
      // play() rejected (often a buffering issue). Surface as a retry path
      // rather than a silent dead-end.
      setAudioFailed(true);
      showToast("Couldn't play just now. Tap to retry.");
    });}
  };

  const seekAudio=(e)=>{if(!audioRef.current||!audioDuration)return;const r=e.currentTarget.getBoundingClientRect();const pct=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));audioRef.current.currentTime=pct*audioDuration;setElapsed(audioRef.current.currentTime);};

  const exitPlayer=()=>{
    if(audioRef.current){audioRef.current.pause();audioRef.current.src='';}
    cancelAnimationFrame(animRef.current);setIsPlaying(false);setActiveSession(null);setElapsed(0);setAudioDuration(0);setShowComplete(false);setScreen("library");
  };

  const doCheckin=(state)=>{
    setCheckinState(state);setCheckinDone(true);setSelectedCheckin(null);setShowCheckin(false);
    // Persist face state to Supabase (fire and forget)
    if(supabase&&authUser){
      supabase.from('face_states').insert({
        user_id:       authUser.id,
        dominant_state:state.dominant,
        source:        'manual_checkin',
      }).then(()=>{}).catch(()=>{});
    }
  };

  const getSuggested=()=>{
    if(checkinDone&&checkinState){
      return sessions.find(s=>s.id===checkinState.meditationId) || sessions[0];
    }
    const c=timeCtx();
    if(c==="morning")return sessions[0]; if(c==="midday"||c==="afternoon")return sessions[1]; if(c==="evening")return sessions[2]; return sessions[4];
  };

  const openMicro=(id)=>{setMicroActive(id);setMicroDone(false);setMicroMsg("");};
  const closeMicro=()=>{setMicroActive(null);setMicroDone(false);};

  const completeMicro=(msg,scoreBoost)=>{setMicroDone(true);setMicroMsg(msg);setNsScore(s=>Math.min(100,s+scoreBoost));setScoreHistory(h=>[...h.slice(-6),Math.min(100,nsScore+scoreBoost)]);};

  const cur=activeSession?sessions.find(s=>s.id===activeSession):null;
  const suggested=getSuggested();
  const effDur=audioDuration||(cur?.duration||0);
  const progress=effDur>0?(elapsed/effDur)*100:0;
  const remaining=Math.max(0,effDur-elapsed);

  const container={width:"100%",maxWidth:430,margin:"0 auto",minHeight:"100vh",background:B.darkGrad,color:B.cream,fontFamily:F,position:"relative",overflowX:"hidden",overflowY:"auto"};

  // ── Supabase session completion (async, fire-and-forget) ──
  const completeSessionOnServer=(sessionType,ritualType,durationSecs,faceStateAfter)=>{
    if(!supabase||!authUser) return;
    supabase.auth.getSession().then(({data})=>{
      const token=data.session?.access_token;
      if(!token) return;
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-session`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body:JSON.stringify({
          session_type:sessionType,
          ritual_type:ritualType||undefined,
          duration_seconds:durationSecs,
          face_state_after:faceStateAfter||undefined,
        }),
      }).catch(()=>{});
    }).catch(()=>{});
  };

  const navBtn=(id,Icon,label)=>{
    const a=screen===id||(id==="rituals"&&(screen==="player"||screen==="library"))||(id==="meditations"&&screen==="meditations");
    return(
      <button key={id} onClick={()=>id!=="player"&&setScreen(id)} className="rhei-card"
        style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",padding:"0 10px",position:"relative"}}>
        {a&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",width:20,height:1,background:B.goldGradSimple,borderRadius:1}}/>}
        <Icon size={19} color={a?B.gold:B.muted} strokeWidth={a?1.8:1.4} style={{transition:"color 0.25s"}}/>
        <span style={{fontSize:8,color:a?B.gold:B.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:SF,transition:"color 0.25s"}}>{label}</span>
      </button>
    );
  };

  // ══════════ ONBOARDING ══════════
  // Account required: every visitor must sign up or sign in before reaching
  // the app. This closes the previous "Explore first" bypass and also
  // protects against returning users who land here with a lost session.
  // When supabaseEnabled is false (no env vars, dev fallback), we let
  // localStorage onboarding stand on its own.
  if(!onboarded || (supabaseEnabled && !authUser)) {
    return <Onboarding authUser={authUser} onComplete={(name)=>{setUserName(name);setOnboarded(true);save('onboarded',true);}} />;
  }

  // ══════════ TODAY ══════════
  const renderHome=()=>{
    const tc = timeCtx();
    const arc = getArc(checkinDone?checkinState:null, tc);
    const ritualLocked = arc.ritual.isPremium && !hasAccess;
    const zoneMap = {"gua-sha":"jawline","lymphatic":"nodes","face-lift":"cheeks","buccal":"jawline","pre-event":"full","eye-revival":"undereye","belly-flow":"navel"};
    const ritualZone = zoneMap[arc.ritual.id]||"full";
    const personalizedMsg = checkinState?.message || null;

    // ── Time-aware editorial daily statement ──
    // Returns the headline + a single italic sub-line. Curated, not generated.
    const dailyMessage = (() => {
      if (tc === "morning")   return { h: "Today is for softening.",          s: "Begin in your own time." };
      if (tc === "midday")    return { h: "The body has been waiting.",        s: "A short pause, before everything else." };
      if (tc === "afternoon") return { h: "Loosen what tightened.",            s: "You don't have to carry it through the night." };
      if (tc === "evening")   return { h: "Putting the day down.",             s: "What needs to land, lands here." };
      return                          { h: "You're already where you need to be.", s: "Stay for a moment." };
    })();

    const firstName = userName ? userName.split(/\s+/)[0] : "";
    const greeting = (() => {
      if (tc === "morning")   return firstName ? `Good morning, ${firstName}.` : "Good morning.";
      if (tc === "evening")   return firstName ? `Good evening, ${firstName}.` : "Good evening.";
      if (tc === "night")     return firstName ? `Still here, ${firstName}.`   : "Still here.";
      return firstName ? `Hello, ${firstName}.` : "Hello.";
    })();

    return (
    <div className="rhei-page" style={{
      position:"relative",
      padding:"calc(env(safe-area-inset-top, 0px) + 68px) 22px 140px",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #241509 0%, #1A0F06 55%, #0F0905 100%)",
      overflow:"hidden",
    }}>
      {/* Soft atmospheric warmth */}
      <div style={{position:"absolute",top:0,right:0,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle, rgba(196,154,75,0.09) 0%, transparent 65%)",filter:"blur(40px)",pointerEvents:"none"}}/>

      <div style={{position:"relative", zIndex:1, maxWidth:430, margin:"0 auto"}}>

        {/* ── HEADER — wordmark + greeting + membership chip ── */}
        <div className="rhei-rise rhei-rise-1" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:36}}>
          <div>
            <h1 style={{fontFamily:F,fontSize:13,letterSpacing:"0.38em",color:B.champagne,fontWeight:400,margin:"0 0 8px",textTransform:"uppercase"}}>Rhei.</h1>
            <p style={{fontFamily:F,fontSize:26,fontWeight:300,color:B.vellum,margin:0,letterSpacing:"-0.02em",lineHeight:1.1,fontVariationSettings:"'opsz' 48"}}>{greeting}</p>
          </div>
          <button onClick={()=>setScreen("premium")} className="rhei-press" style={{background:"rgba(248,242,229,0.04)",border:`1px solid ${isPremium?"rgba(196,154,75,0.35)":isInTrial?"rgba(196,154,75,0.22)":"rgba(248,242,229,0.10)"}`,borderRadius:100,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginTop:4}}>
            <Crown size={10} color={isPremium||isInTrial?B.polished:"rgba(248,242,229,0.50)"} strokeWidth={1.5}/>
            <span style={{fontFamily:SF,fontSize:9,color:isPremium||isInTrial?B.polished:"rgba(248,242,229,0.55)",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:500}}>
              {isPremium ? "Member" : isInTrial ? `${trialDaysLeft}d left` : "Unlock"}
            </span>
          </button>
        </div>

        {/* ── Daily editorial line ── */}
        <div className="rhei-rise rhei-rise-1" style={{marginBottom:36, paddingBottom:28, borderBottom:"1px solid rgba(248,242,229,0.08)"}}>
          <p style={{fontFamily:F,fontStyle:"italic",fontSize:18,color:"rgba(248,242,229,0.72)",lineHeight:1.45,margin:"0 0 8px",fontWeight:300,letterSpacing:"-0.008em",maxWidth:340}}>{dailyMessage.h}</p>
          <p style={{fontFamily:F,fontSize:13,color:"rgba(248,242,229,0.42)",lineHeight:1.55,margin:0,maxWidth:300}}>{dailyMessage.s}</p>
        </div>

        {/* ── PWA install whisper ── */}
        {showInstallPrompt && !isStandalone && (
          <div className="rhei-rise rhei-rise-2" style={{background:"rgba(248,242,229,0.04)",border:"1px solid rgba(248,242,229,0.08)",borderRadius:16,padding:"13px 16px",marginBottom:22,display:"flex",alignItems:"center",gap:12,position:"relative"}}>
            <button onClick={dismissInstall} style={{position:"absolute",top:8,right:8,background:"none",border:"none",cursor:"pointer",padding:4}}><X size={11} color="rgba(248,242,229,0.4)"/></button>
            <button onClick={installApp} style={{flex:1,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,paddingRight:18}}>
              <p style={{fontFamily:F,fontSize:13,color:B.paper,margin:"0 0 2px"}}>Keep Rhei. close.</p>
              <p style={{fontFamily:F,fontSize:11,color:"rgba(248,242,229,0.50)",margin:0}}>Add to home screen.</p>
            </button>
            <ArrowRight size={13} color={B.polished}/>
          </div>
        )}

        {/* ── Mood state echo or check-in nudge ── */}
        {personalizedMsg ? (
          <div className="rhei-rise rhei-rise-2" style={{background:"rgba(196,154,75,0.06)",border:"1px solid rgba(196,154,75,0.16)",borderRadius:16,padding:"18px 18px",marginBottom:30,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14}}>
            <p style={{fontFamily:F,fontStyle:"italic",fontSize:15,color:B.vellum,margin:0,fontWeight:300,lineHeight:1.5,flex:1}}>{personalizedMsg}</p>
            <button onClick={()=>{setCheckinDone(false);setCheckinState(null);}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.45)",fontFamily:SF,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",flexShrink:0,padding:0,marginTop:2}}>Change</button>
          </div>
        ) : (
          <div className="rhei-rise rhei-rise-2" style={{marginBottom:30}}>
            <button className="rhei-press" onClick={()=>setShowCheckin(true)} style={{width:"100%",background:"rgba(248,242,229,0.03)",border:"1px solid rgba(248,242,229,0.09)",borderRadius:16,padding:"18px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <p style={{fontFamily:F,fontSize:15,color:B.vellum,margin:"0 0 3px",fontWeight:300,lineHeight:1.3}}>How did you arrive today?</p>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:12,color:"rgba(248,242,229,0.45)",margin:0}}>Eight states. Pick the closest.</p>
              </div>
              <ArrowRight size={14} color="rgba(196,154,75,0.55)" strokeWidth={1.5}/>
            </button>
          </div>
        )}

        {/* ── FACE RITUAL — primary action card ── */}
        <div className="rhei-rise rhei-rise-3" style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.36em",textTransform:"uppercase",color:"rgba(196,154,75,0.65)",margin:0}}>Face Ritual</p>
            <button onClick={()=>setScreen("rituals")} className="rhei-press" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.40)",fontFamily:SF,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",padding:0}}>
              All →
            </button>
          </div>
          <button
            onClick={()=>{if(ritualLocked){setScreen("premium");}else{setActiveRitual(generateAdaptiveRitual(arc.ritual,checkinState));}}}
            className="rhei-press"
            style={{width:"100%",background:"linear-gradient(160deg, rgba(58,37,22,0.80) 0%, rgba(26,15,6,0.90) 100%)",border:"1px solid rgba(196,154,75,0.20)",borderRadius:22,padding:"22px 20px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",boxShadow:"0 18px 48px -16px rgba(15,9,5,0.70)"}}>
            <div style={{position:"absolute",top:"-20%",right:"-10%",width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle, rgba(245,216,160,0.18) 0%, rgba(196,154,75,0.06) 45%, transparent 70%)",filter:"blur(24px)",pointerEvents:"none"}}/>
            {ritualLocked && (
              <div style={{position:"absolute",top:14,right:14,display:"flex",alignItems:"center",gap:4,background:"rgba(196,154,75,0.12)",padding:"3px 9px",borderRadius:100,border:"1px solid rgba(196,154,75,0.22)"}}>
                <Lock size={8} color={B.polished} strokeWidth={2}/>
                <span style={{fontFamily:SF,fontSize:8,letterSpacing:"0.16em",color:B.polished,textTransform:"uppercase",fontWeight:500}}>Members</span>
              </div>
            )}
            <div style={{position:"relative",zIndex:2,display:"flex",alignItems:"flex-start",gap:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(196,154,75,0.10)",border:"1px solid rgba(196,154,75,0.20)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <FaceGuideIllustration zone={ritualZone} size={28}/>
              </div>
              <div style={{flex:1}}>
                <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.26em",textTransform:"uppercase",color:"rgba(196,154,75,0.75)",margin:"0 0 5px"}}>{arc.ritual.duration}</p>
                <h2 style={{fontFamily:F,fontSize:22,fontWeight:300,color:B.vellum,letterSpacing:"-0.015em",lineHeight:1.12,margin:"0 0 5px",fontVariationSettings:"'opsz' 48"}}>{arc.ritual.title}</h2>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:12,color:"rgba(248,242,229,0.52)",margin:"0 0 18px",lineHeight:1.4}}>{arc.ritual.subtitle}</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:B.paper,borderRadius:100,padding:"10px 20px",boxShadow:"0 6px 20px -8px rgba(248,242,229,0.22)"}}>
                  <span style={{fontFamily:SF,fontSize:12,color:B.espresso,fontWeight:600,letterSpacing:"0.04em"}}>{ritualLocked ? "Members only" : "Begin ritual"}</span>
                  <ArrowRight size={12} color={B.espresso} strokeWidth={2}/>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* ── MEDITATION ── */}
        <div className="rhei-rise rhei-rise-3" style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.36em",textTransform:"uppercase",color:"rgba(196,154,75,0.65)",margin:0}}>Meditation</p>
            <button onClick={()=>setScreen("meditations")} className="rhei-press" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.40)",fontFamily:SF,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",padding:0}}>
              All →
            </button>
          </div>
          <button
            className="rhei-press"
            onClick={()=>{const locked=arc.audio.id!==1&&!hasAccess;if(locked){setScreen("premium");}else{startSession(arc.audio.id);}}}
            style={{width:"100%",background:"rgba(248,242,229,0.03)",border:"1px solid rgba(248,242,229,0.09)",borderRadius:18,padding:"16px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg, rgba(196,154,75,0.18), rgba(196,154,75,0.06))",border:"1px solid rgba(196,154,75,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Play size={13} color={B.polished} fill={B.polished} style={{marginLeft:2}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <h3 style={{fontFamily:F,fontSize:16,color:B.vellum,margin:"0 0 3px",fontWeight:300,lineHeight:1.25,letterSpacing:"-0.008em"}}>{arc.audio.title}</h3>
              <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.48)",margin:0,lineHeight:1.4}}>{arc.audio.subtitle}</p>
            </div>
            <span style={{fontFamily:SF,fontSize:10,color:"rgba(248,242,229,0.38)",flexShrink:0}}>{Math.ceil(arc.audio.duration/60)} min</span>
          </button>
        </div>

        {/* ── Hairline divider ── */}
        <div className="rhei-rise rhei-rise-4" style={{height:1,background:"rgba(196,154,75,0.10)",marginBottom:28}}/>

        {/* ── QUIET RELIEF — 2×2 grid ── */}
        <div className="rhei-rise rhei-rise-4" style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.36em",textTransform:"uppercase",color:"rgba(196,154,75,0.65)",margin:0}}>Quick Relief</p>
            <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.35)",margin:0}}>Under two minutes</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {microInterventions.map(mi=>(
              <button key={mi.id} className="rhei-press" onClick={()=>openMicro(mi.id)}
                style={{background:"rgba(248,242,229,0.03)",border:"1px solid rgba(248,242,229,0.08)",borderRadius:16,padding:"15px 14px",cursor:"pointer",textAlign:"left",minHeight:110,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div>
                  <span style={{fontFamily:SF,fontSize:8,color:"rgba(196,154,75,0.80)",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,background:"rgba(196,154,75,0.10)",padding:"2px 7px",borderRadius:4,display:"inline-block",marginBottom:9}}>{mi.badge}</span>
                  <p style={{fontFamily:F,fontSize:14,color:B.vellum,margin:"0 0 3px",fontWeight:300,lineHeight:1.25,letterSpacing:"-0.005em"}}>{mi.title}</p>
                  <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.44)",margin:0,lineHeight:1.4}}>{mi.desc}</p>
                </div>
                <ArrowRight size={10} color="rgba(196,154,75,0.38)" strokeWidth={1.5} style={{marginTop:8}}/>
              </button>
            ))}
          </div>
        </div>

        {/* ── Membership whisper (trial ended only) ── */}
        {!hasAccess && (
          <div className="rhei-rise rhei-rise-5" style={{marginBottom:24}}>
            <button className="rhei-press" onClick={()=>setScreen("premium")}
              style={{width:"100%",background:"linear-gradient(160deg, rgba(196,154,75,0.10) 0%, rgba(26,15,6,0.88) 100%)",border:"1px solid rgba(196,154,75,0.20)",borderRadius:20,padding:"22px 20px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-24,right:-24,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle, rgba(212,173,106,0.16) 0%, transparent 65%)",filter:"blur(18px)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.34em",textTransform:"uppercase",color:B.polished,margin:"0 0 10px"}}>Membership · €14.99/mo</p>
                <h3 style={{fontFamily:F,fontSize:21,fontWeight:300,color:B.vellum,letterSpacing:"-0.015em",lineHeight:1.2,margin:"0 0 8px",maxWidth:300,fontVariationSettings:"'opsz' 60"}}>The full practice, open to you.</h3>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:13,color:"rgba(248,242,229,0.55)",margin:"0 0 16px",lineHeight:1.5}}>Every ritual. Every meditation. Unlocked.</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:7}}>
                  <span style={{fontFamily:SF,fontSize:10,color:B.polished,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:500}}>Begin →</span>
                </div>
              </div>
            </button>
          </div>
        )}

      </div>
    </div>
  );};

  // ══════════ LIBRARY (hidden — absorbed into Rituals) ══════════
  const renderLibrary=()=>renderRituals();

  // ══════════ PLAYER ══════════
  const renderPlayer=()=>{
    if(!cur)return null;
    return(
      <div style={{
        padding:"36px 22px 120px",minHeight:"100vh",
        display:"flex",flexDirection:"column",alignItems:"center",
        position:"relative",
        // Pure dark warm-black. The <Orb> behind the timer is now the single
        // source of warm light, perfectly concentric with the <Ring>.
        backgroundColor:B.warmBlack,
      }}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:"60%",background:"radial-gradient(ellipse at 50% 30%, rgba(196,154,75,0.05) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <button onClick={exitPlayer} style={{position:"absolute",top:18,left:18,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.muted,fontFamily:SF,fontSize:11,letterSpacing:0.5}}><ChevronLeft size={14}/><span>Back</span></button>
        <div style={{textAlign:"center",marginTop:36,marginBottom:36}}>
          <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:8}}>Audio reset</p>
          <h1 style={{fontSize:26,fontWeight:400,color:B.cream,margin:"0 0 4px",fontFamily:F}}>{cur.title}</h1>
          <p style={{fontSize:13,color:B.muted,fontFamily:F}}>{cur.subtitle}</p>
        </div>
        <div style={{position:"relative",width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:44}}>
          <Orb active={isPlaying} size={220}/><Ring progress={progress} size={220}/>
          <div style={{position:"absolute",textAlign:"center",zIndex:5}}>
            <p style={{fontSize:36,color:B.cream,margin:0,fontFamily:SF,fontWeight:300}}>{fmt(remaining)}</p>
            <p style={{fontSize:9,color:B.muted,margin:"4px 0 0",letterSpacing:2,textTransform:"uppercase",fontFamily:SF}}>remaining</p>
          </div>
        </div>
        <button onClick={togglePlay} disabled={audioLoading} style={{width:68,height:68,borderRadius:"50%",background:audioLoading?B.card:B.goldGrad,border:"none",cursor:audioLoading?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36,boxShadow:audioLoading?"none":`0 6px 28px ${B.gold}30`,opacity:audioLoading?0.6:1,transition:"opacity 0.3s"}}>
          {audioLoading?<div style={{width:24,height:24,border:`2px solid ${B.gold}40`,borderTop:`2px solid ${B.gold}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:isPlaying?<Pause size={24} color={B.warmBlack}/>:<Play size={24} color={B.warmBlack} fill={B.warmBlack} style={{marginLeft:3}}/>}
        </button>
        <div style={{width:"100%",marginBottom:32}}>
          <div onClick={seekAudio} style={{width:"100%",height:16,display:"flex",alignItems:"center",cursor:"pointer",padding:"6px 0"}}>
            <div style={{width:"100%",height:3,borderRadius:2,background:`${B.gold}12`,position:"relative"}}>
              <div style={{width:`${progress}%`,height:"100%",borderRadius:2,background:B.goldGrad,transition:"width 0.3s linear",position:"relative"}}>
                <div style={{position:"absolute",right:-5,top:-4,width:10,height:10,borderRadius:"50%",background:B.gold,boxShadow:`0 0 8px ${B.gold}50`,opacity:isPlaying?1:0,transition:"opacity 0.3s"}}/>
              </div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
            <span style={{fontSize:10,color:B.muted,fontFamily:SF}}>{fmt(elapsed)}</span>
            <span style={{fontSize:10,color:B.muted,fontFamily:SF}}>{fmt(effDur)}</span>
          </div>
        </div>
        <div style={{width:"100%",background:B.card,borderRadius:16,padding:"18px",border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 10px"}}>Technique</p>
          <p style={{fontSize:12,color:B.creamMuted,margin:"0 0 12px",lineHeight:1.5,fontFamily:SF}}>{cur.technique}</p>
          <div style={{display:"flex",alignItems:"center",gap:5,opacity:0.6}}><Clock size={11} color={B.muted}/><span style={{fontSize:11,color:B.muted,fontFamily:SF}}>Best for: {cur.bestFor}</span></div>
        </div>
        {showComplete&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(8,5,3,0.97)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div style={{textAlign:"center",padding:32,maxWidth:340}}>
              <div style={{width:80,height:80,borderRadius:"50%",background:`rgba(196,154,75,0.08)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",border:`1px solid rgba(196,154,75,0.2)`,boxShadow:B.goldGlow}}><Sparkles size={28} color={B.gold}/></div>
              <h2 style={{fontSize:26,color:B.cream,fontWeight:400,margin:"0 0 6px",fontFamily:F}}>You showed up.</h2>
              <p style={{fontSize:14,color:B.muted,margin:"0 0 4px",fontFamily:F}}>{cur.title}</p>
              <p style={{fontSize:11,color:B.goldDim,fontFamily:SF,margin:"0 0 28px",letterSpacing:0.5}}>{Math.ceil(cur.duration/60)} minutes</p>
              {/* Stats row (Duration / Today / Streak) removed — Rhei. does not count. */}
              <p style={{fontSize:13,color:"rgba(248,242,229,0.62)",fontFamily:F,fontStyle:"italic",margin:"0 0 28px",lineHeight:1.5,maxWidth:280}}>The point was never the count. Only the return.</p>
              <button onClick={exitPlayer} style={{background:B.goldGrad,border:"none",borderRadius:28,padding:"14px 42px",cursor:"pointer",color:B.warmBlack,fontSize:12,fontFamily:SF,letterSpacing:2,fontWeight:700,boxShadow:B.goldGlowSm}} className="rhei-gold-shimmer">Continue</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════ RITUALS — face check-in inline ══════════
  const renderRituals=()=>{
    const zoneMap = {"gua-sha":"jawline","lymphatic":"nodes","face-lift":"cheeks","buccal":"jawline","pre-event":"full","eye-revival":"undereye","belly-flow":"navel"};
    const recommended = checkinDone && checkinState
      ? rituals.find(r=>r.id===checkinState.ritualId)
      : null;
    return (
    <div style={{
      position:"relative",
      padding:"calc(env(safe-area-inset-top, 0px) + 86px) 0 140px",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
      overflow:"hidden",
    }}>
      <DramaticGodRays intensity={0.95} pierce="50%" />

      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px"}}>

        {/* Back to Collection */}
        {prevScreen === "collection" && (
          <button onClick={()=>{setPrevScreen(null);setScreen("collection");}} style={{
            background:"none", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", gap:6,
            color:"rgba(248,242,229,0.55)", fontFamily:SF, fontSize:10,
            fontWeight:500, letterSpacing:"0.18em", textTransform:"uppercase",
            padding:"0 0 22px", marginTop:-16,
          }}>
            <ChevronLeft size={12}/> The Collection
          </button>
        )}

        {/* ── HERO: editorial photo + tight typography ── */}
        <div className="rhei-rise rhei-rise-1" style={{ marginBottom:44, marginTop:8 }}>
          {/* Editorial photograph as anchor — close-up skin/hands */}
          <div style={{ position:"relative", marginBottom:28, borderRadius:2, overflow:"hidden" }}>
            <EditorialPhoto src="/images/rituals-hero.jpg" tone="skin" aspect="5 / 4" overlay={true}>
              <div style={{
                position:"absolute", top:18, left:18, right:18,
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <PrecisionStamp label="RHEI" value="RITUALS" color="rgba(242,235,220,0.85)"/>
                <PrecisionStamp label="07" color="rgba(242,235,220,0.65)"/>
              </div>
              <div style={{ position:"absolute", bottom:24, left:22, right:22 }}>
                <h1 style={{
                  fontFamily:F, fontSize:"clamp(34px, 9vw, 48px)",
                  fontWeight:300, color:"#F2EBDC",
                  letterSpacing:"-0.025em", lineHeight:0.98,
                  margin:0,
                  fontVariationSettings:"'opsz' 144",
                }}>
                  Rituals
                </h1>
              </div>
            </EditorialPhoto>
          </div>
          <p style={{
            fontFamily:F, fontSize:16, fontWeight:300,
            color:"rgba(242,235,220,0.72)", lineHeight:1.45,
            margin:0, letterSpacing:"-0.005em",
            maxWidth:380,
          }}>
            Seven practices for the face and the nervous system. Each with its own tool, its own pressure, its own outcome.
          </p>
        </div>

        {/* ── HERO LIVE BUTTON: Mirror Mode — luminar pill on dark ── */}
        <button
          onClick={()=>setScreen("mirror")}
          className="rhei-press rhei-rise rhei-rise-2"
          style={{
            width:"100%", marginBottom:64,
            background:"transparent",
            border:"none",
            cursor:"pointer", textAlign:"center",
            position:"relative",
            padding:"24px 0 0",
          }}>
          {/* Subtle inner light bloom behind the pill */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            width:320, height:160, borderRadius:"50%",
            background:"radial-gradient(ellipse, rgba(245,200,120,0.22) 0%, rgba(245,200,120,0.06) 40%, transparent 70%)",
            filter:"blur(28px)",
            transform:"translate(-50%, -50%)",
            pointerEvents:"none",
          }}/>
          <div style={{position:"relative", zIndex:1}}>
            <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(245,200,120,0.80)", margin:"0 0 12px"}}>
              Mirror Mode — New
            </p>
            <p style={{fontFamily:F, fontSize:14, color:"rgba(248,242,229,0.65)", lineHeight:1.5, margin:"0 0 24px", maxWidth:320, marginLeft:"auto", marginRight:"auto"}}>
              Your face, guided live. The camera finds the tension and walks you through it.
            </p>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:10,
              background:"rgba(248,242,229,0.95)",
              color:"#1A0F06",
              fontFamily:SF, fontSize:13, fontWeight:600,
              letterSpacing:"0.06em",
              padding:"13px 28px",
              borderRadius:100,
              boxShadow:"0 16px 40px -14px rgba(248,242,229,0.40), 0 4px 14px rgba(15,9,5,0.4)",
            }}>
              <Camera size={13} color="#1A0F06" strokeWidth={2}/>
              <span>Begin live ritual</span>
            </div>
            <p style={{fontFamily:SF, fontSize:11, color:"rgba(248,242,229,0.45)", margin:"14px 0 0", letterSpacing:"0.04em"}}>
              or browse below
            </p>
          </div>
        </button>

        {/* ── Recommended ribbon ── */}
        {recommended && (
          <div className="rhei-rise rhei-rise-3" style={{marginBottom:24, textAlign:"center"}}>
            <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(245,200,120,0.70)", margin:"0 0 6px"}}>For where you are</p>
            <p style={{fontFamily:F, fontSize:13, color:"rgba(248,242,229,0.60)", margin:0, lineHeight:1.5}}>
              We'd guide you to <span style={{color:B.vellum, fontStyle:"normal"}}>{recommended.title}</span>.
            </p>
          </div>
        )}

        {/* ── Section divider ── */}
        <div style={{height:1, background:"linear-gradient(90deg, transparent, rgba(245,200,120,0.22), transparent)", margin:"0 -8px 8px"}}/>
        <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(245,200,120,0.65)", margin:"22px 0 8px", textAlign:"center"}}>
          The Full Library — Seven Rituals
        </p>

        {/* ── Editorial ritual list — gallery program typography ── */}
        <div className="rhei-rise rhei-rise-4" style={{display:"flex", flexDirection:"column", marginTop:18}}>
          {rituals.map((r, idx)=>{
            const locked = r.isPremium && !hasAccess;
            const isRecommended = recommended?.id === r.id;
            const accent = r.accent || "#D4AD6A";
            const ritualZone = zoneMap[r.id] || "full";
            return (
              <button
                key={r.id}
                onClick={()=>{if(locked){setScreen("premium");}else{setActiveRitual(generateAdaptiveRitual(r,checkinState));}}}
                className="rhei-press"
                style={{
                  width:"100%",
                  background:"transparent",
                  border:"none",
                  borderBottom: idx === rituals.length-1 ? "none" : "1px solid rgba(248,242,229,0.06)",
                  padding:"24px 4px",
                  cursor:"pointer",
                  textAlign:"left",
                  position:"relative",
                  display:"flex",
                  alignItems:"center",
                  gap:16,
                  opacity: locked ? 0.55 : 1,
                  overflow:"hidden",
                }}>
                {/* Glowing orb marker — the diagram inside has been removed;
                    the orb's accent halo + center glow is the ritual's signature */}
                <div style={{
                  flexShrink:0,
                  width:64, height:64, borderRadius:"50%",
                  position:"relative",
                  background:`radial-gradient(circle, ${accent}55 0%, ${accent}18 45%, transparent 72%)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow: isRecommended ? `0 0 36px ${accent}50` : "none",
                  transition:"all 0.3s ease",
                }}>
                  <div style={{
                    width:10, height:10, borderRadius:"50%",
                    background:accent,
                    boxShadow:`0 0 14px ${accent}, 0 0 28px ${accent}80, inset 0 0 4px rgba(255,255,255,0.4)`,
                  }}/>
                </div>

                {/* Content — editorial serif */}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:"flex", alignItems:"baseline", gap:10, marginBottom:5, flexWrap:"wrap"}}>
                    <h3 style={{
                      fontFamily:F,
                      fontSize:"clamp(20px, 5vw, 24px)",
                      fontWeight:300,
                      color:B.vellum,
                      letterSpacing:"-0.015em",
                      lineHeight:1.1,
                      margin:0,
                      fontVariationSettings:"'opsz' 48",
                    }}>
                      {r.title}
                    </h3>
                    {isRecommended && !locked && (
                      <span style={{fontFamily:SF, fontSize:8, letterSpacing:"0.28em", textTransform:"uppercase", color:accent, fontWeight:500}}>
                        For you
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontFamily:F, 
                    fontSize:12.5, color:"rgba(248,242,229,0.58)",
                    margin:"0 0 8px", lineHeight:1.5,
                  }}>
                    {r.subtitle}
                  </p>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <span style={{fontFamily:SF, fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(248,242,229,0.50)", fontWeight:500}}>
                      {r.duration}
                    </span>
                    {locked && (
                      <span style={{fontFamily:SF, fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(245,200,120,0.70)", fontWeight:500, display:"inline-flex", alignItems:"center", gap:4}}>
                        <Lock size={8} strokeWidth={2}/> Members
                      </span>
                    )}
                  </div>
                </div>

                {isRecommended && !locked ? (
                  <div style={{
                    flexShrink:0,
                    background:"rgba(248,242,229,0.95)",
                    color:"#1A0F06",
                    fontFamily:SF, fontSize:11, fontWeight:600,
                    letterSpacing:"0.06em",
                    padding:"9px 18px",
                    borderRadius:100,
                    boxShadow:"0 8px 22px -8px rgba(248,242,229,0.35), 0 2px 8px rgba(15,9,5,0.4)",
                  }}>
                    Enter
                  </div>
                ) : (
                  <ArrowRight size={16} color="rgba(248,242,229,0.45)" strokeWidth={1.5} style={{flexShrink:0}}/>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Membership invitation — light pill at bottom ── */}
        {!isPremium && !isInTrial && (
          <div className="rhei-rise rhei-rise-4" style={{
            marginTop:56,
            textAlign:"center",
            padding:"40px 24px",
            position:"relative",
          }}>
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              width:280, height:280, borderRadius:"50%",
              background:"radial-gradient(circle, rgba(245,200,120,0.18) 0%, rgba(245,200,120,0.05) 40%, transparent 70%)",
              filter:"blur(28px)",
              transform:"translate(-50%, -50%)",
              pointerEvents:"none",
            }}/>
            <div style={{position:"relative", zIndex:1}}>
              <p style={{fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(245,200,120,0.70)", margin:"0 0 14px"}}>
                Membership
              </p>
              <h3 style={{
                fontFamily:F, fontSize:"clamp(22px, 5.5vw, 26px)",
                fontWeight:300, color:B.vellum,
                letterSpacing:"-0.015em", lineHeight:1.18,
                margin:"0 0 12px",
                fontVariationSettings:"'opsz' 48",
                maxWidth:320, marginLeft:"auto", marginRight:"auto",
              }}>
                Every ritual, open to you.
              </h3>
              <p style={{
                fontFamily:F, 
                fontSize:13, color:"rgba(248,242,229,0.60)",
                lineHeight:1.55, margin:"0 auto 26px",
                maxWidth:280,
              }}>
                Every tool. Every audio room. The whole practice.
              </p>
              <button
                onClick={()=>setScreen("premium")}
                className="rhei-press"
                style={{
                  background:"rgba(248,242,229,0.95)",
                  border:"none",
                  color:"#1A0F06",
                  fontFamily:SF, fontSize:13, fontWeight:600,
                  letterSpacing:"0.06em",
                  padding:"13px 30px",
                  borderRadius:100,
                  cursor:"pointer",
                  boxShadow:"0 16px 40px -14px rgba(248,242,229,0.40), 0 4px 14px rgba(15,9,5,0.4)",
                }}>
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );};

  // ══════════ MEDITATIONS — Luminar god-rays edition ══════════
  const renderMeditations=()=>{
    const recommendedSession = medCheckinDone && medCheckinState
      ? sessions.find(s=>s.id===medCheckinState.sessionId)
      : null;
    const [moodOpen, _] = [true, null]; // mood always inline now
    return (
    <div style={{
      position:"relative",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
      overflow:"hidden",
      padding:"calc(env(safe-area-inset-top, 0px) + 86px) 0 140px",
    }}>
      <DramaticGodRays intensity={1} pierce="50%" />

      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px"}}>

        {/* Back to Collection — shown when navigated from collection page */}
        {prevScreen === "collection" && (
          <button onClick={()=>{setPrevScreen(null);setScreen("collection");}} style={{
            background:"none", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", gap:6,
            color:"rgba(248,242,229,0.55)", fontFamily:SF, fontSize:10,
            fontWeight:500, letterSpacing:"0.18em", textTransform:"uppercase",
            padding:"0 0 22px", marginTop:-16,
          }}>
            <ChevronLeft size={12}/> The Collection
          </button>
        )}

        {/* ── HERO: editorial photograph + tight type ── */}
        <div className="rhei-rise rhei-rise-1" style={{
          marginBottom:44,
          marginTop:8,
        }}>{/* end-marker — content below */}

          {/* Editorial photograph — water/skin tone (calm) */}
          <div style={{ position:"relative", marginBottom:28, borderRadius:2, overflow:"hidden", textAlign:"left" }}>
            <EditorialPhoto src="/images/meditations-hero.jpg" tone="water" aspect="5 / 4" overlay={true}>
              <div style={{
                position:"absolute", top:18, left:18, right:18,
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <PrecisionStamp label="RHEI" value="MEDITATIONS" color="rgba(242,235,220,0.85)"/>
                <PrecisionStamp label="05" color="rgba(242,235,220,0.65)"/>
              </div>
              <div style={{ position:"absolute", bottom:24, left:22, right:22 }}>
                <h1 style={{
                  fontFamily:F, fontSize:"clamp(34px, 9vw, 48px)",
                  fontWeight:300, color:"#F2EBDC",
                  letterSpacing:"-0.025em", lineHeight:0.98,
                  margin:0,
                  fontVariationSettings:"'opsz' 144",
                }}>
                  Meditations
                </h1>
              </div>
            </EditorialPhoto>
          </div>
          <p style={{
            fontFamily:F, fontSize:16, fontWeight:300,
            color:"rgba(242,235,220,0.72)", lineHeight:1.45,
            margin:0, letterSpacing:"-0.005em",
            maxWidth:380, textAlign:"left",
          }}>
            Five audio practices for the nervous system. Each one a different mode of return.
          </p>
        </div>

        {/* ── Mood pill row — soft horizontal scroll, integrated into atmosphere ── */}
        <div className="rhei-rise rhei-rise-2" style={{marginBottom:48}}>
          <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(245,200,120,0.65)", margin:"0 0 14px", textAlign:"center"}}>
            Where are you, right now?
          </p>
          <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:6, justifyContent:"center", flexWrap:"wrap"}}>
            {meditationStates.map(state=>{
              const selected = medCheckinState?.id===state.id;
              return (
                <button key={state.id}
                  onClick={()=>{setMedCheckinState(state);setMedCheckinDone(true);}}
                  className="rhei-press"
                  style={{
                    background: selected ? "rgba(248,242,229,0.92)" : "rgba(248,242,229,0.06)",
                    backdropFilter:"blur(14px)",
                    WebkitBackdropFilter:"blur(14px)",
                    border: selected ? "1px solid rgba(248,242,229,0.92)" : "1px solid rgba(248,242,229,0.16)",
                    borderRadius:100,
                    padding:"9px 16px",
                    cursor:"pointer",
                    fontFamily:SF, fontSize:11, fontWeight:500,
                    color: selected ? "#1A0F06" : "rgba(248,242,229,0.78)",
                    letterSpacing:"0.04em",
                    whiteSpace:"nowrap",
                    transition:"all 0.18s ease",
                  }}>
                  {state.label}
                </button>
              );
            })}
          </div>
          {medCheckinDone && recommendedSession && (
            <p style={{fontFamily:F, fontSize:12, color:"rgba(245,200,120,0.78)", textAlign:"center", margin:"16px 0 0"}}>
              We'd guide you to <span style={{color:B.vellum, fontStyle:"normal"}}>{recommendedSession.title}</span>.
            </p>
          )}
        </div>

        {/* ── Section divider line ── */}
        <div style={{height:1, background:"linear-gradient(90deg, transparent, rgba(245,200,120,0.22), transparent)", margin:"0 -8px 36px"}}/>

        {/* ── Editorial vertical session list — gallery-program typography ── */}
        <div className="rhei-rise rhei-rise-3" style={{display:"flex", flexDirection:"column"}}>
          {sessions.map((s, idx)=>{
            const locked = s.id!==1 && !hasAccess;
            const done = completedToday.includes(s.id);
            const isRec = recommendedSession?.id===s.id;
            const accent = s.accent || "#D4AD6A";
            const mins = Math.ceil(s.duration/60);
            return (
              <button
                key={s.id}
                onClick={()=>{if(locked){setScreen("premium");}else{startSession(s.id);}}}
                className="rhei-press"
                style={{
                  width:"100%",
                  background:"transparent",
                  border:"none",
                  borderBottom: idx === sessions.length-1 ? "none" : "1px solid rgba(248,242,229,0.06)",
                  padding:"26px 4px 26px",
                  cursor:"pointer",
                  textAlign:"left",
                  position:"relative",
                  display:"flex",
                  alignItems:"center",
                  gap:18,
                  opacity: locked ? 0.55 : 1,
                }}>
                {/* Glowing orb on the left — each session's signature color */}
                <div style={{
                  flexShrink:0,
                  width:54, height:54, borderRadius:"50%",
                  position:"relative",
                  background: done
                    ? "radial-gradient(circle, rgba(120,180,140,0.45) 0%, rgba(120,180,140,0.12) 50%, transparent 70%)"
                    : `radial-gradient(circle, ${accent}55 0%, ${accent}18 40%, transparent 70%)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow: isRec ? `0 0 30px ${accent}40` : "none",
                  transition:"all 0.3s ease",
                }}>
                  <div style={{
                    width:14, height:14, borderRadius:"50%",
                    background: done
                      ? "rgba(180,220,190,0.95)"
                      : `radial-gradient(circle, ${accent} 0%, ${accent} 40%, ${accent}80 100%)`,
                    boxShadow: done
                      ? "0 0 12px rgba(180,220,190,0.6)"
                      : `0 0 14px ${accent}, inset 0 0 6px rgba(255,255,255,0.4)`,
                  }}/>
                </div>

                {/* Content — editorial serif stack */}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:"flex", alignItems:"baseline", gap:10, marginBottom:6, flexWrap:"wrap"}}>
                    <h3 style={{
                      fontFamily:F,
                      fontSize:"clamp(22px, 5.5vw, 26px)",
                      fontWeight:300,
                      color: B.vellum,
                      letterSpacing:"-0.015em",
                      lineHeight:1.1,
                      margin:0,
                      fontVariationSettings:"'opsz' 48",
                    }}>
                      {s.title}
                    </h3>
                    {isRec && !locked && (
                      <span style={{fontFamily:SF, fontSize:8, letterSpacing:"0.28em", textTransform:"uppercase", color:accent, fontWeight:500}}>
                        For you
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontFamily:F, 
                    fontSize:13, color:"rgba(248,242,229,0.58)",
                    margin:"0 0 10px", lineHeight:1.5,
                  }}>
                    {s.subtitle}
                  </p>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <span style={{fontFamily:SF, fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(248,242,229,0.50)", fontWeight:500}}>
                      {mins} min
                    </span>
                    {s.id===1 && !locked && (
                      <span style={{fontFamily:SF, fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(180,220,190,0.70)", fontWeight:500}}>
                        · Free
                      </span>
                    )}
                    {locked && (
                      <span style={{fontFamily:SF, fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(245,200,120,0.70)", fontWeight:500, display:"inline-flex", alignItems:"center", gap:4}}>
                        <Lock size={8} strokeWidth={2}/> Members
                      </span>
                    )}
                  </div>
                </div>

                {/* Right-side white pill CTA (Luminar-style) — only on recommended, otherwise arrow */}
                {isRec && !locked ? (
                  <div style={{
                    flexShrink:0,
                    background:"rgba(248,242,229,0.95)",
                    color:"#1A0F06",
                    fontFamily:SF, fontSize:11, fontWeight:600,
                    letterSpacing:"0.06em",
                    padding:"9px 18px",
                    borderRadius:100,
                    boxShadow:"0 8px 22px -8px rgba(248,242,229,0.35), 0 2px 8px rgba(15,9,5,0.4)",
                  }}>
                    Begin
                  </div>
                ) : (
                  <ArrowRight size={16} color="rgba(248,242,229,0.45)" strokeWidth={1.5} style={{flexShrink:0}}/>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Membership invitation — light pill at bottom, Luminar-style ── */}
        {!isPremium && !isInTrial && (
          <div className="rhei-rise rhei-rise-4" style={{
            marginTop:56,
            textAlign:"center",
            padding:"40px 24px",
            position:"relative",
          }}>
            {/* Soft halo behind the CTA */}
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              width:280, height:280, borderRadius:"50%",
              background:"radial-gradient(circle, rgba(245,200,120,0.18) 0%, rgba(245,200,120,0.05) 40%, transparent 70%)",
              filter:"blur(28px)",
              transform:"translate(-50%, -50%)",
              pointerEvents:"none",
            }}/>
            <div style={{position:"relative", zIndex:1}}>
              <p style={{fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(245,200,120,0.70)", margin:"0 0 14px"}}>
                Membership
              </p>
              <h3 style={{
                fontFamily:F, fontSize:"clamp(22px, 5.5vw, 26px)",
                fontWeight:300, color:B.vellum,
                letterSpacing:"-0.015em", lineHeight:1.18,
                margin:"0 0 12px",
                fontVariationSettings:"'opsz' 48",
                maxWidth:320, marginLeft:"auto", marginRight:"auto",
              }}>
                Four more rooms. One key.
              </h3>
              <p style={{
                fontFamily:F, 
                fontSize:13, color:"rgba(248,242,229,0.60)",
                lineHeight:1.55, margin:"0 auto 26px",
                maxWidth:280,
              }}>
                Pre-meeting, evening melt, post-conflict, and quick return. All yours.
              </p>
              <button
                onClick={()=>setScreen("premium")}
                className="rhei-press"
                style={{
                  background:"rgba(248,242,229,0.95)",
                  border:"none",
                  color:"#1A0F06",
                  fontFamily:SF, fontSize:13, fontWeight:600,
                  letterSpacing:"0.06em",
                  padding:"13px 30px",
                  borderRadius:100,
                  cursor:"pointer",
                  boxShadow:"0 16px 40px -14px rgba(248,242,229,0.40), 0 4px 14px rgba(15,9,5,0.4)",
                }}>
                Continue
              </button>
              <p style={{fontFamily:SF, fontSize:11, color:"rgba(248,242,229,0.45)", margin:"18px 0 0", letterSpacing:"0.04em"}}>
                or <button onClick={()=>setScreen("premium")} style={{background:"none", border:"none", color:"rgba(248,242,229,0.70)", fontFamily:SF, fontSize:11, cursor:"pointer", textDecoration:"underline", textUnderlineOffset:3, padding:0}}>see what's inside</button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );};

  // ══════════ PREMIUM — Membership Room ══════════
  const renderPremium=()=>(
    <div style={{
      position:"relative",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
      overflow:"hidden",
      padding:"calc(env(safe-area-inset-top, 0px) + 28px) 0 140px",
    }}>
      <DramaticGodRays intensity={1.05} pierce="50%" />

      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px"}}>

        {/* Top stamp row */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
          <PrecisionStamp label="RHEI" value={isPremium ? "MEMBER" : isInTrial ? "TRIAL" : "MEMBERSHIP"} color="rgba(242,235,220,0.85)"/>
          <PrecisionStamp label={isInTrial ? `${trialDaysLeft}D LEFT` : "01 / 01"} color="rgba(242,235,220,0.45)"/>
        </div>

        {/* HERO — editorial photo + tight type, copy adapts to trial state */}
        <div className="rhei-rise rhei-rise-1" style={{ marginBottom:36, marginTop:8 }}>
          <div style={{ position:"relative", marginBottom:24, borderRadius:2, overflow:"hidden" }}>
            <EditorialPhoto src="/images/membership-hero.jpg" tone="stone" aspect="3 / 2" overlay={true}>
              <div style={{ position:"absolute", bottom:22, left:22, right:22 }}>
                <h1 style={{
                  fontFamily:F, fontSize:"clamp(34px, 9vw, 48px)",
                  fontWeight:300, color:"#F2EBDC",
                  letterSpacing:"-0.025em", lineHeight:0.98,
                  margin:0,
                  fontVariationSettings:"'opsz' 144",
                }}>
                  {isPremium ? "Member" : isInTrial ? "Your trial" : "Continue"}
                </h1>
              </div>
            </EditorialPhoto>
          </div>
          <p style={{
            fontFamily:F, fontSize:16, fontWeight:300,
            color:"rgba(242,235,220,0.72)", lineHeight:1.45,
            margin:0, letterSpacing:"-0.005em",
            maxWidth:380,
          }}>
            {isPremium
              ? "You're in. The whole practice is yours."
              : isInTrial
                ? `You have ${trialDaysLeft} day${trialDaysLeft===1?"":"s"} of full access remaining. Continue past your trial whenever you're ready — your practice carries over.`
                : "Your trial has ended. Continue with full access, or keep the Morning Reset — yours forever."}
          </p>
        </div>

        {/* PRICING — twin glass plinths */}
        <div className="rhei-rise rhei-rise-2" style={{display:"flex", gap:12, marginBottom:28}}>
          <button
            onClick={()=>handleCheckout('monthly')}
            disabled={checkoutLoading}
            className="rhei-press"
            style={{
              flex:1,
              background:"rgba(248,242,229,0.04)",
              backdropFilter:"blur(14px)",
              border:"1px solid rgba(248,242,229,0.10)",
              borderRadius:20, padding:"22px 16px 18px",
              cursor: checkoutLoading?"wait":"pointer",
              opacity: checkoutLoading?0.6:1,
              textAlign:"center",
              position:"relative",
            }}>
            {!isPremium && (
              <div style={{position:"absolute", top:-9, left:"50%", transform:"translateX(-50%)", background:"rgba(180,220,190,0.95)", color:"#0A1F12", padding:"3px 12px", borderRadius:100, fontSize:8, fontWeight:600, letterSpacing:"0.22em", fontFamily:SF, textTransform:"uppercase", whiteSpace:"nowrap"}}>14 days free</div>
            )}
            <PrecisionStamp label="Monthly" color="rgba(248,242,229,0.50)"/>
            <p style={{fontFamily:F, fontSize:36, fontWeight:300, color:"#F8F2E5", margin:"12px 0 0", lineHeight:1, fontVariationSettings:"'opsz' 72", letterSpacing:"-0.02em", fontVariantNumeric:"tabular-nums"}}>
              €14<span style={{fontSize:18, color:"rgba(248,242,229,0.55)"}}>.99</span>
            </p>
            <p style={{fontFamily:SF, fontSize:9, color:"rgba(248,242,229,0.45)", margin:"4px 0 14px", letterSpacing:"0.22em", textTransform:"uppercase"}}>per month</p>
            <div style={{borderTop:"1px solid rgba(248,242,229,0.10)", paddingTop:10, fontFamily:SF, fontSize:11, color:"rgba(245,200,120,0.85)", letterSpacing:"0.06em"}}>{isPremium ? "Subscribe" : "Start free trial"}</div>
          </button>

          <button
            onClick={()=>handleCheckout('yearly')}
            disabled={checkoutLoading}
            className="rhei-press"
            style={{
              flex:1,
              background:"rgba(245,200,120,0.10)",
              backdropFilter:"blur(14px)",
              border:"1px solid rgba(245,200,120,0.40)",
              borderRadius:20, padding:"22px 16px 18px",
              cursor: checkoutLoading?"wait":"pointer",
              opacity: checkoutLoading?0.6:1,
              textAlign:"center",
              position:"relative",
              boxShadow:"0 16px 40px -14px rgba(245,200,120,0.30), inset 0 0 24px rgba(245,200,120,0.06)",
            }}>
            <div style={{position:"absolute", top:-9, left:"50%", transform:"translateX(-50%)", background:"rgba(248,242,229,0.95)", color:"#1A0F06", padding:"3px 12px", borderRadius:100, fontSize:8, fontWeight:500, letterSpacing:"0.22em", fontFamily:SF, textTransform:"uppercase"}}>A year ahead</div>
            <PrecisionStamp label="Yearly" color="rgba(245,200,120,0.85)"/>
            <p style={{fontFamily:F, fontSize:36, fontWeight:300, color:"#F8F2E5", margin:"12px 0 0", lineHeight:1, fontVariationSettings:"'opsz' 72", letterSpacing:"-0.02em", fontVariantNumeric:"tabular-nums"}}>
              €79
            </p>
            <p style={{fontFamily:SF, fontSize:9, color:"rgba(248,242,229,0.55)", margin:"4px 0 14px", letterSpacing:"0.22em", textTransform:"uppercase"}}>per year</p>
            <div style={{borderTop:"1px solid rgba(245,200,120,0.30)", paddingTop:10, fontFamily:SF, fontSize:10, color:"#F5C878", letterSpacing:"0.22em", fontWeight:500, textTransform:"uppercase"}}>The full practice</div>
          </button>
        </div>

        <p style={{textAlign:"center", fontFamily:F, fontSize:10.5, color:"rgba(248,242,229,0.40)", margin:"0 0 18px", letterSpacing:"0.02em", fontStyle:"italic"}}>
          Shown in EUR · billed in your local currency at checkout
        </p>

        {checkoutLoading && (
          <p style={{textAlign:"center", fontFamily:F, fontSize:12, color:"rgba(248,242,229,0.55)", margin:"0 0 20px"}}>
            Opening checkout…
          </p>
        )}

        {/* MANIFEST — what's included, editorial list */}
        <div className="rhei-rise rhei-rise-3" style={{
          background:"rgba(248,242,229,0.03)",
          backdropFilter:"blur(12px)",
          border:"1px solid rgba(248,242,229,0.08)",
          borderRadius:22, padding:"24px 22px", marginBottom:18,
        }}>
          <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:18}}>
            <PrecisionStamp label="Manifest" color="rgba(245,200,120,0.75)"/>
            <PrecisionStamp label="15 Items" color="rgba(248,242,229,0.45)"/>
          </div>
          {[
            {text:"Morning Reset", note:"audio · free forever", free:true},
            {text:"Pre-Meeting Reset", note:"audio", free:false},
            {text:"End of Day Reset", note:"audio", free:false},
            {text:"After Conflict Reset", note:"audio", free:false},
            {text:"Quick Reset", note:"audio", free:false},
            {text:"Physiological Sigh · Jaw · Grounding · Tap", note:"techniques", free:true},
            {text:"Gua Sha Sculpt", note:"ritual", free:true},
            {text:"Lymphatic Drainage", note:"ritual", free:true},
            {text:"Face Lifting", note:"ritual", free:true},
            {text:"Buccal Release", note:"ritual", free:true},
            {text:"Pre-Event Glow", note:"ritual", free:false},
            {text:"Eye Revival", note:"ritual", free:false},
            {text:"NS Score · Daily Tracking", note:"insights", free:true},
            {text:"All future rituals & resets", note:"on release", free:false},
            {text:"Priority access to new rooms", note:"first", free:false},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex", alignItems:"center", gap:14, padding:"10px 0", borderTop: i===0 ? "none" : "1px solid rgba(248,242,229,0.05)"}}>
              <span style={{flexShrink:0, width:22, fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.22em", color:"rgba(248,242,229,0.40)", fontVariantNumeric:"tabular-nums"}}>
                {String(i+1).padStart(2,"0")}
              </span>
              <div style={{flexShrink:0, width:8, height:8, borderRadius:"50%", background: f.free ? "rgba(180,220,190,0.85)" : "#F5C878", boxShadow: f.free ? "0 0 8px rgba(180,220,190,0.5)" : "0 0 8px rgba(245,200,120,0.6)"}}/>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontFamily:F, fontSize:14, fontWeight:300, color:"#F8F2E5", margin:0, fontVariationSettings:"'opsz' 48", letterSpacing:"-0.01em"}}>{f.text}</p>
                <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.22em", textTransform:"uppercase", color: f.free ? "rgba(180,220,190,0.70)" : "rgba(245,200,120,0.65)", margin:"2px 0 0"}}>{f.free ? "✓ FREE · " : "MEMBER · "}{f.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ON THE WAY — Coming Soon section for forthcoming members-only content */}
        <div className="rhei-rise rhei-rise-3" style={{
          background:"linear-gradient(180deg, rgba(245,200,120,0.05) 0%, rgba(248,242,229,0.02) 100%)",
          backdropFilter:"blur(12px)",
          border:"1px solid rgba(245,200,120,0.18)",
          borderRadius:22, padding:"24px 22px", marginBottom:18,
        }}>
          <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:18}}>
            <PrecisionStamp label="On the Way" color="rgba(245,200,120,0.85)"/>
            <PrecisionStamp label="Members First" color="rgba(245,200,120,0.50)"/>
          </div>
          {[
            {
              text: "Professional Guide",
              sub: "One-on-one sessions with a certified practitioner. Personal program, live feedback, monthly check-ins.",
              eta: "COMING SOON",
            },
            {
              text: "Mirror Mode AR",
              sub: "Camera-guided live ritual. The AR finds your tension and walks you through it in real time.",
              eta: "IN PROGRESS",
            },
            {
              text: "Practitioner Library",
              sub: "Filmed sessions from a roster of facialists and somatic teachers. New release every month.",
              eta: "Q3",
            },
          ].map((f, i) => (
            <div key={i} style={{display:"flex", alignItems:"flex-start", gap:14, padding:"14px 0", borderTop: i===0 ? "none" : "1px solid rgba(245,200,120,0.08)"}}>
              <span style={{flexShrink:0, width:22, fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.22em", color:"rgba(245,200,120,0.55)", fontVariantNumeric:"tabular-nums", paddingTop:4}}>
                {String(i+1).padStart(2,"0")}
              </span>
              <div style={{flexShrink:0, width:8, height:8, borderRadius:"50%", marginTop:6, background:"rgba(245,200,120,0.45)", border:"1px solid rgba(245,200,120,0.6)"}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:10, marginBottom:6, flexWrap:"wrap"}}>
                  <p style={{fontFamily:F, fontSize:16, fontWeight:300, color:"#F8F2E5", margin:0, fontVariationSettings:"'opsz' 48", letterSpacing:"-0.01em"}}>{f.text}</p>
                  <span style={{fontFamily:SF, fontSize:8.5, fontWeight:500, letterSpacing:"0.26em", color:"rgba(245,200,120,0.75)", whiteSpace:"nowrap"}}>{f.eta}</span>
                </div>
                <p style={{fontFamily:F, fontSize:13, color:"rgba(248,242,229,0.62)", margin:0, lineHeight:1.5, letterSpacing:"-0.005em"}}>{f.sub}</p>
              </div>
            </div>
          ))}
          <div style={{marginTop:14, paddingTop:14, borderTop:"1px solid rgba(245,200,120,0.08)"}}>
            <p style={{fontFamily:F, fontSize:12, color:"rgba(248,242,229,0.55)", margin:0, lineHeight:1.55, letterSpacing:"-0.005em"}}>
              Members receive everything on the way — included as it releases, no additional cost.
            </p>
          </div>
        </div>

        {/* RESTORE / SIGN-IN */}
        {supabase && !authUser ? (
          <div className="rhei-rise rhei-rise-4" style={{
            background:"rgba(248,242,229,0.02)",
            backdropFilter:"blur(10px)",
            border:"1px solid rgba(248,242,229,0.06)",
            borderRadius:18, padding:"18px 20px",
          }}>
            <PrecisionStamp label="Already a member" color="rgba(245,200,120,0.65)"/>
            <p style={{fontFamily:F, fontSize:12.5, color:"rgba(248,242,229,0.60)", margin:"8px 0 14px", lineHeight:1.5}}>
              Sign in with the email used at checkout to restore access.
            </p>
            <div style={{display:"flex", gap:8}}>
              <input type="email" placeholder="your@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signInWithEmail()} style={{flex:1, background:"rgba(248,242,229,0.04)", border:"1px solid rgba(248,242,229,0.10)", borderRadius:10, padding:"9px 14px", color:"#F8F2E5", fontSize:12, fontFamily:SF, outline:"none"}}/>
              <button onClick={signInWithEmail} style={{background:"rgba(245,200,120,0.15)", border:"1px solid rgba(245,200,120,0.30)", borderRadius:10, padding:"9px 16px", cursor:"pointer", color:"#F5C878", fontSize:11, fontFamily:SF, letterSpacing:"0.06em", fontWeight:500, whiteSpace:"nowrap"}}>Sign in</button>
            </div>
            {authSent && <p style={{fontFamily:F, fontSize:11, color:"rgba(180,220,190,0.85)", margin:"10px 0 0"}}>Check your email for a sign-in link.</p>}
            {authError && <p style={{fontFamily:F, fontSize:11, color:"rgba(228,138,118,0.85)", margin:"10px 0 0"}}>{authError}</p>}
          </div>
        ) : (
          <div className="rhei-rise rhei-rise-4" style={{textAlign:"center"}}>
            <button onClick={()=>{
              if(authUser?.email){
                fetchWithRetry('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:authUser.email})})
                  .then(r=>r.json()).then(data=>{if(data.isPremium){setIsPremium(true);save('isPremium',true);showToast("Your access is restored. Welcome back.");}else{showToast("No active subscription on this email.");}}).catch(()=>showToast("Couldn't verify just now. Tap Restore access to retry."));
              } else {setIsPremium(true);save('isPremium',true);}
            }} style={{background:"none", border:"none", color:"rgba(248,242,229,0.55)", fontSize:11, fontFamily:SF, cursor:"pointer", padding:8, letterSpacing:"0.04em", textDecoration:"underline", textUnderlineOffset:3}}>Already purchased? Restore access</button>
          </div>
        )}

        {/* MANAGE PLAN — Stripe Customer Portal (cancel · switch monthly↔yearly · update card) */}
        {isPremium && (
          <div className="rhei-rise rhei-rise-4" style={{
            background:"rgba(248,242,229,0.03)",
            backdropFilter:"blur(12px)",
            border:"1px solid rgba(248,242,229,0.08)",
            borderRadius:22, padding:"22px 22px", marginTop:18, marginBottom:8,
          }}>
            <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:14}}>
              <PrecisionStamp label="Membership" color="rgba(245,200,120,0.75)"/>
              <PrecisionStamp label="Active" color="rgba(180,220,190,0.85)"/>
            </div>
            <button
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="rhei-press"
              style={{
                width:"100%",
                background:"rgba(248,242,229,0.04)",
                backdropFilter:"blur(14px)",
                border:"1px solid rgba(248,242,229,0.14)",
                borderRadius:14, padding:"14px 16px",
                cursor: portalLoading?"wait":"pointer",
                opacity: portalLoading?0.6:1,
                color:"#F8F2E5", fontFamily:SF, fontSize:12,
                letterSpacing:"0.06em",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
              {portalLoading ? "Opening…" : "Manage plan · Cancel · Switch"}
            </button>
            <p style={{fontFamily:F, fontSize:11.5, color:"rgba(248,242,229,0.55)", margin:"12px 0 0", lineHeight:1.5}}>
              Change billing, switch monthly ↔ yearly, or cancel at any time. Your practice carries on.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ══════════ JOURNEY ══════════
  // Note: streak/total state (meditationStreak, longestStreak, totalSessions,
  // completedToday, totalMinutes) is still computed and persisted upstream,
  // but no longer surfaced in any UI. Kept in state for graceful migration in
  // case Rhei. ever introduces a private "memory" feature in the future.
  const renderProgress=()=>{
    return(
      <div style={{
        position:"relative",
        minHeight:"100vh",
        background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
        overflow:"hidden",
        padding:"0 0 140px",
      }}>
        <DramaticGodRays intensity={0.9} pierce="50%" />

        <div style={{position:"relative", zIndex:1}}>

        {/* HERO — editorial cinematic photo, full bleed */}
        <div className="rhei-rise rhei-rise-1" style={{
          position:"relative",
          height:380,
          marginBottom:36,
          backgroundColor:"#0A0604",
          backgroundImage:`linear-gradient(180deg, rgba(10,6,4,0.15) 0%, rgba(10,6,4,0.0) 25%, rgba(10,6,4,0.45) 65%, rgba(12,9,7,1) 100%), url('/images/journey-hero.jpg')`,
          backgroundSize:"cover",
          backgroundPosition:"center",
          backgroundRepeat:"no-repeat",
          display:"flex",
          flexDirection:"column",
          justifyContent:"flex-end",
          padding:"calc(env(safe-area-inset-top, 0px) + 22px) 24px 28px",
          overflow:"hidden",
        }}>
          <div className="rhei-grain" style={{opacity:0.6}}/>
          {/* Top corner readouts */}
          <div style={{position:"absolute", top:"calc(env(safe-area-inset-top, 0px) + 22px)", left:24, right:24, display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:2}}>
            <PrecisionStamp label="RHEI" value="JOURNEY" color="rgba(242,235,220,0.85)"/>
            <PrecisionStamp label={new Date().toLocaleDateString("en-US",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()} color="rgba(242,235,220,0.65)"/>
          </div>

          {/* Title block at bottom of hero */}
          <div style={{position:"relative", zIndex:1}}>
            <PrecisionStamp label="Your Practice" color="rgba(242,235,220,0.75)"/>
            <h1 style={{
              fontFamily:F, fontSize:"clamp(36px, 9.5vw, 50px)",
              fontWeight:300, color:"#F2EBDC",
              letterSpacing:"-0.025em", lineHeight:0.98,
              margin:"14px 0 12px",
              fontVariationSettings:"'opsz' 144",
              textShadow:"0 2px 16px rgba(0,0,0,0.55)",
            }}>
              {userName || "The Record"}
            </h1>
            <p style={{
              fontFamily:F, fontSize:15, fontWeight:300,
              color:"rgba(242,235,220,0.78)",
              margin:0, lineHeight:1.4,
              letterSpacing:"-0.005em",
              textShadow:"0 1px 8px rgba(0,0,0,0.5)",
              maxWidth:360,
            }}>
              The face is the record of what you've shown up for.
            </p>
          </div>
        </div>

        <div style={{maxWidth:480, margin:"0 auto", padding:"0 24px"}}>

          {/* THE PRACTICE — quiet editorial block replacing the former
              streak panel, progression bullets, and stats grid. Rhei. does
              not count days, sessions, or minutes. */}
          <div className="rhei-rise rhei-rise-2" style={{
            position:"relative",
            background:"rgba(248,242,229,0.04)",
            backdropFilter:"blur(14px) saturate(1.1)",
            WebkitBackdropFilter:"blur(14px) saturate(1.1)",
            border:"1px solid rgba(245,200,120,0.18)",
            borderRadius:22,
            padding:"38px 28px 34px",
            marginBottom:18,
            overflow:"hidden",
            textAlign:"center",
          }}>
            <div style={{position:"absolute", top:"50%", left:"50%", width:340, height:340, borderRadius:"50%", background:"radial-gradient(circle, rgba(245,200,120,0.18) 0%, rgba(245,200,120,0.04) 40%, transparent 70%)", filter:"blur(30px)", transform:"translate(-50%, -50%)", pointerEvents:"none"}}/>
            <CornerBrackets inset={10} size={12} color="rgba(245,200,120,0.30)"/>

            <div style={{position:"relative", zIndex:1}}>
              <PrecisionStamp label="The Practice" color="rgba(245,200,120,0.75)"/>
              <p style={{
                fontFamily:F,
                fontSize:21,
                fontWeight:300,
                fontStyle:"italic",
                color:"rgba(248,242,229,0.88)",
                lineHeight:1.45,
                margin:"22px auto 18px",
                maxWidth:320,
                fontVariationSettings:"'opsz' 60",
                letterSpacing:"-0.005em",
              }}>
                We don&rsquo;t count days. The point was never the count.
              </p>
              <p style={{
                fontFamily:F,
                fontSize:13,
                color:"rgba(248,242,229,0.62)",
                lineHeight:1.65,
                margin:"0 auto",
                maxWidth:320,
              }}>
                What you build here is invisible from the outside and obvious from within. A softer jaw. A quieter morning. A face that remembers safety. The practice is yours, kept privately.
              </p>
            </div>
          </div>

          {/* PHOTO JOURNAL — the gallery slot */}
          <div className="rhei-rise rhei-rise-4" style={{
            background:"rgba(248,242,229,0.03)",
            backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            border:"1px solid rgba(248,242,229,0.08)",
            borderRadius:22,
            padding:"24px 22px",
            marginBottom:18,
          }}>
            <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8}}>
              <PrecisionStamp label="Archive" color="rgba(245,200,120,0.70)"/>
              <PrecisionStamp label="Coming Soon" color="rgba(248,242,229,0.40)"/>
            </div>
            <p style={{fontFamily:F, fontSize:13.5, color:"rgba(248,242,229,0.62)", margin:"0 0 18px", lineHeight:1.55}}>
              A weekly self-portrait, kept private. For you, not for us.
            </p>
            <div style={{display:"flex", gap:10}}>
              {["Before","After"].map((label, i) => (
                <div key={i} style={{
                  flex:1,
                  position:"relative",
                  background:"rgba(248,242,229,0.02)",
                  border:"1px solid rgba(245,200,120,0.18)",
                  borderRadius:14,
                  padding:"30px 14px",
                  textAlign:"center",
                  overflow:"hidden",
                }}>
                  <CornerBrackets inset={6} size={8} color="rgba(245,200,120,0.40)"/>
                  <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(248,242,229,0.55)", margin:0}}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PROFILE / ACCOUNT */}
          <div className="rhei-rise rhei-rise-4" style={{
            background:"rgba(248,242,229,0.02)",
            backdropFilter:"blur(10px)",
            border:"1px solid rgba(248,242,229,0.06)",
            borderRadius:18,
            padding:"18px 20px",
          }}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{display:"flex", alignItems:"center", gap:14}}>
                <div style={{
                  width:42, height:42, borderRadius:"50%",
                  background:"radial-gradient(circle, rgba(245,200,120,0.40) 0%, rgba(245,200,120,0.10) 50%, transparent 75%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <User size={15} color="#F5C878" strokeWidth={1.5}/>
                </div>
                <div>
                  <p style={{fontFamily:F, fontSize:15, fontWeight:300, color:"#F8F2E5", margin:0, fontVariationSettings:"'opsz' 48", letterSpacing:"-0.01em"}}>{userName||"Set your name"}</p>
                  <p style={{fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.22em", textTransform:"uppercase", color: isPremium ? "#F5C878" : isInTrial ? "#F5C878" : "rgba(248,242,229,0.45)", margin:"3px 0 0"}}>
                    {isPremium ? "Member" : isInTrial ? `Trial \u00B7 ${trialDaysLeft} day${trialDaysLeft===1?"":"s"} left` : "Trial ended"}
                  </p>
                </div>
              </div>
              <button
                onClick={()=>{setEditingNameValue(userName||'');setEditingName(true);}}
                style={{
                  background:"rgba(248,242,229,0.06)",
                  border:"1px solid rgba(248,242,229,0.12)",
                  borderRadius:100,
                  padding:"7px 14px", cursor:"pointer",
                  color:"rgba(248,242,229,0.75)", fontSize:10,
                  fontFamily:SF, letterSpacing:"0.22em",
                  textTransform:"uppercase", fontWeight:500,
                }}>
                Edit
              </button>
            </div>
            {supabase && authUser && (
              <div style={{borderTop:"1px solid rgba(248,242,229,0.06)", paddingTop:14, marginTop:14, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <Mail size={11} color="rgba(248,242,229,0.50)"/>
                  <span style={{fontFamily:SF, fontSize:11, color:"rgba(248,242,229,0.65)"}}>{authUser.email}</span>
                </div>
                <button onClick={signOut} style={{background:"none", border:"none", color:"rgba(248,242,229,0.55)", fontFamily:SF, fontSize:10, cursor:"pointer", letterSpacing:"0.22em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:5}}>
                  <LogOut size={10}/>Sign out
                </button>
              </div>
            )}
            {/* Push notifications — only show on browsers that support it */}
            {pushStatus !== 'unsupported' && (
              <div style={{borderTop:"1px solid rgba(248,242,229,0.06)", paddingTop:14, marginTop:14}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
                  <div style={{display:"flex", alignItems:"center", gap:10, minWidth:0}}>
                    <Bell size={12} color={pushStatus === 'on' ? "#F5C878" : "rgba(248,242,229,0.50)"} strokeWidth={1.6}/>
                    <div style={{minWidth:0}}>
                      <p style={{fontFamily:SF, fontSize:11, fontWeight:500, color:"rgba(248,242,229,0.85)", margin:0, letterSpacing:"0.04em"}}>Gentle reminders</p>
                      <p style={{fontFamily:F, fontSize:11, color:"rgba(248,242,229,0.50)", margin:"2px 0 0", lineHeight:1.35}}>
                        {pushStatus === 'denied' ? "Blocked — enable in browser settings." : "A quiet nudge for your daily reset."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={togglePush}
                    disabled={pushStatus === 'busy' || pushStatus === 'denied' || !authUser}
                    style={{
                      flexShrink:0,
                      background: pushStatus === 'on' ? "rgba(245,200,120,0.18)" : "rgba(248,242,229,0.06)",
                      border: pushStatus === 'on' ? "1px solid rgba(245,200,120,0.40)" : "1px solid rgba(248,242,229,0.12)",
                      borderRadius:100,
                      padding:"7px 14px",
                      cursor: (pushStatus === 'busy' || pushStatus === 'denied' || !authUser) ? "not-allowed" : "pointer",
                      color: pushStatus === 'on' ? "#F5C878" : "rgba(248,242,229,0.75)",
                      fontSize:10,
                      fontFamily:SF, letterSpacing:"0.22em",
                      textTransform:"uppercase", fontWeight:500,
                      opacity: (pushStatus === 'denied' || !authUser) ? 0.5 : 1,
                    }}>
                    {pushStatus === 'on' ? 'On' : pushStatus === 'busy' ? '…' : pushStatus === 'denied' ? 'Blocked' : 'Turn on'}
                  </button>
                </div>
                {pushMsg && (
                  <p style={{fontFamily:F, fontSize:10.5, color:"rgba(248,242,229,0.55)", margin:"10px 0 0", lineHeight:1.4}}>{pushMsg}</p>
                )}
                {!authUser && (
                  <p style={{fontFamily:F, fontSize:10.5, color:"rgba(248,242,229,0.45)", margin:"10px 0 0", lineHeight:1.4}}>Sign in to enable reminders across your devices.</p>
                )}
              </div>
            )}
            {supabase && !authUser && (
              <div style={{borderTop:"1px solid rgba(248,242,229,0.06)", paddingTop:14, marginTop:14}}>
                <p style={{fontFamily:SF, fontSize:11, color:"rgba(248,242,229,0.55)", margin:"0 0 10px"}}>Sign in to sync access across devices.</p>
                <div style={{display:"flex", gap:8}}>
                  <input type="email" placeholder="your@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signInWithEmail()} style={{flex:1, background:"rgba(248,242,229,0.04)", border:"1px solid rgba(248,242,229,0.10)", borderRadius:10, padding:"9px 14px", color:"#F8F2E5", fontSize:12, fontFamily:SF, outline:"none"}}/>
                  <button onClick={signInWithEmail} style={{background:"rgba(245,200,120,0.15)", border:"1px solid rgba(245,200,120,0.30)", borderRadius:10, padding:"9px 16px", cursor:"pointer", color:"#F5C878", fontSize:11, fontFamily:SF, letterSpacing:"0.06em", fontWeight:500, whiteSpace:"nowrap"}}>Sign in</button>
                </div>
                {authSent && <p style={{fontFamily:F, fontSize:11, color:"rgba(180,220,190,0.85)", margin:"10px 0 0"}}>Check your email for a sign-in link.</p>}
                {authError && <p style={{fontFamily:F, fontSize:11, color:"rgba(228,138,118,0.85)", margin:"10px 0 0"}}>{authError}</p>}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  };

  // ══════════ THE COLLECTION ══════════
  // The Collection — four practice rooms + editorial "by moment" menu.
  // Design: full-bleed atmospheric header, oversized practice tiles with
  // accent glows, and an editorial contents-page list — all in the dark
  // warm-black palette with champagne gold.
  const renderCollection=()=>(
    <div className="rhei-page" style={{
      position:"relative",
      minHeight:"100vh",
      background:"#060301",
      overflow:"hidden",
      padding:"calc(env(safe-area-inset-top, 0px) + 86px) 0 160px",
    }}>
      {/* Deep atmospheric crown — warm gold spill from above */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"55vh",background:"linear-gradient(180deg, rgba(196,154,75,0.10) 0%, transparent 100%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"130%",height:480,background:"radial-gradient(ellipse at 50% -5%, rgba(196,154,75,0.18) 0%, rgba(196,154,75,0.04) 38%, transparent 62%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:120,right:-80,width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle, rgba(196,154,75,0.06) 0%, transparent 60%)",filter:"blur(50px)",pointerEvents:"none"}}/>

      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto"}}>

        {/* ── TITLE — centered, large, breathing ── */}
        <div style={{padding:"0 24px 56px", textAlign:"center"}}>
          <p style={{fontFamily:SF, fontSize:8, fontWeight:500, letterSpacing:"0.52em", textTransform:"uppercase", color:"rgba(196,154,75,0.50)", margin:"0 0 26px"}}>Season &middot; Stillness</p>
          <h1 style={{fontFamily:F, fontSize:"clamp(54px, 13vw, 70px)", fontWeight:300, letterSpacing:"-0.04em", lineHeight:0.86, color:B.vellum, margin:"0 0 22px", fontVariationSettings:"'opsz' 144"}}>The<br/>Collection</h1>
          <p style={{fontFamily:F, fontStyle:"italic", fontSize:15, color:"rgba(248,242,229,0.40)", lineHeight:1.6, margin:"0 auto", maxWidth:260, letterSpacing:"0.004em"}}>Four rooms. Enter the one calling you.</p>
        </div>

        {/* ── ROOMS — asymmetric editorial layout ── */}
        <div style={{padding:"0 18px", display:"flex", flexDirection:"column", gap:10, marginBottom:68}}>

          {/* ①  Face Sculpting — featured, tall, primary room */}
          <button onClick={()=>{setPrevScreen("collection"); setScreen("rituals");}} className="rhei-press" style={{
            width:"100%",
            background:"linear-gradient(150deg, rgba(191,160,120,0.18) 0%, rgba(120,90,55,0.08) 45%, rgba(6,3,1,0.96) 100%)",
            border:"1px solid rgba(191,160,120,0.22)",
            borderRadius:24, padding:"30px 26px 26px",
            cursor:"pointer", textAlign:"left",
            position:"relative", overflow:"hidden", minHeight:190,
            display:"flex", flexDirection:"column", justifyContent:"space-between",
          }}>
            <div style={{position:"absolute",top:-50,right:-40,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle, rgba(191,160,120,0.24) 0%, transparent 58%)",filter:"blur(35px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:"45%",background:"linear-gradient(0deg, rgba(6,3,1,0.75) 0%, transparent 100%)",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:2}}>
              <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.44em",textTransform:"uppercase",color:"rgba(191,160,120,0.65)",margin:"0 0 18px"}}>Face Sculpting</p>
              <h2 style={{fontFamily:F,fontSize:"clamp(26px,6.5vw,34px)",fontWeight:300,letterSpacing:"-0.025em",lineHeight:1.08,color:B.vellum,margin:0,fontVariationSettings:"'opsz' 96",maxWidth:280}}>Seven hands-on rituals for the face.</h2>
            </div>
            <div style={{position:"relative",zIndex:2,display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20}}>
              <span style={{fontFamily:SF,fontSize:8.5,fontWeight:400,letterSpacing:"0.18em",color:"rgba(248,242,229,0.28)",fontStyle:"normal"}}>Gua sha &middot; Buccal &middot; Lift &middot; Drain</span>
              <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(191,160,120,0.11)",border:"1px solid rgba(191,160,120,0.28)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <ArrowRight size={14} color="rgba(191,160,120,0.85)" strokeWidth={1.5}/>
              </div>
            </div>
          </button>

          {/* ②  Meditations + Affirmations — side by side, shorter */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <button onClick={()=>{setPrevScreen("collection"); setScreen("meditations");}} className="rhei-press" style={{
              background:"linear-gradient(150deg, rgba(138,155,175,0.16) 0%, rgba(6,3,1,0.95) 100%)",
              border:"1px solid rgba(138,155,175,0.20)",
              borderRadius:20, padding:"22px 18px 20px",
              cursor:"pointer", textAlign:"left",
              position:"relative", overflow:"hidden",
              minHeight:168, display:"flex", flexDirection:"column", justifyContent:"space-between",
            }}>
              <div style={{position:"absolute",top:-18,right:-18,width:130,height:130,borderRadius:"50%",background:"radial-gradient(circle, rgba(138,155,175,0.20) 0%, transparent 65%)",filter:"blur(20px)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.40em",textTransform:"uppercase",color:"rgba(138,155,175,0.70)",margin:"0 0 16px"}}>Meditations</p>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:14,color:"rgba(248,242,229,0.50)",margin:0,lineHeight:1.45,fontVariationSettings:"'opsz' 48"}}>Lie down.<br/>Press play.</p>
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(138,155,175,0.10)",border:"1px solid rgba(138,155,175,0.22)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <ArrowRight size={12} color="rgba(138,155,175,0.80)" strokeWidth={1.5}/>
              </div>
            </button>

            <button onClick={()=>{setPrevScreen("collection"); setScreen("affirmations");}} className="rhei-press" style={{
              background:"linear-gradient(150deg, rgba(196,154,75,0.16) 0%, rgba(6,3,1,0.95) 100%)",
              border:"1px solid rgba(196,154,75,0.20)",
              borderRadius:20, padding:"22px 18px 20px",
              cursor:"pointer", textAlign:"left",
              position:"relative", overflow:"hidden",
              minHeight:168, display:"flex", flexDirection:"column", justifyContent:"space-between",
            }}>
              <div style={{position:"absolute",top:-18,right:-18,width:130,height:130,borderRadius:"50%",background:"radial-gradient(circle, rgba(196,154,75,0.20) 0%, transparent 65%)",filter:"blur(20px)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.40em",textTransform:"uppercase",color:"rgba(196,154,75,0.70)",margin:"0 0 16px"}}>Affirmations</p>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:14,color:"rgba(248,242,229,0.50)",margin:0,lineHeight:1.45,fontVariationSettings:"'opsz' 48"}}>Spoken.<br/>Heard. Felt.</p>
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(196,154,75,0.10)",border:"1px solid rgba(196,154,75,0.22)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <ArrowRight size={12} color="rgba(196,154,75,0.80)" strokeWidth={1.5}/>
              </div>
            </button>
          </div>

          {/* ③  Breathwork — full-width, minimal horizontal strip */}
          <button onClick={()=>{setPrevScreen("collection"); setScreen("home");}} className="rhei-press" style={{
            width:"100%",
            background:"linear-gradient(135deg, rgba(110,122,108,0.13) 0%, rgba(6,3,1,0.95) 100%)",
            border:"1px solid rgba(110,122,108,0.18)",
            borderRadius:18, padding:"18px 22px 18px 24px",
            cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:16,
          }}>
            <div>
              <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.40em",textTransform:"uppercase",color:"rgba(110,122,108,0.70)",margin:"0 0 7px"}}>Breathwork</p>
              <p style={{fontFamily:F,fontSize:17,fontWeight:300,color:B.vellum,letterSpacing:"-0.012em",lineHeight:1.2,margin:0,fontVariationSettings:"'opsz' 48"}}>Under two minutes.</p>
            </div>
            <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.28)"}}>Quick relief</span>
              <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(110,122,108,0.10)",border:"1px solid rgba(110,122,108,0.20)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <ArrowRight size={12} color="rgba(110,122,108,0.75)" strokeWidth={1.5}/>
              </div>
            </div>
          </button>

        </div>

        {/* ── DIVIDER — italic editorial, not uppercase caps ── */}
        <div style={{margin:"0 24px 32px", display:"flex", alignItems:"center", gap:18}}>
          <div style={{flex:1, height:"1px", background:"linear-gradient(90deg, transparent, rgba(196,154,75,0.15))"}}/>
          <span style={{fontFamily:F, fontStyle:"italic", fontSize:12, color:"rgba(248,242,229,0.28)", letterSpacing:"0.03em"}}>by moment</span>
          <div style={{flex:1, height:"1px", background:"linear-gradient(90deg, rgba(196,154,75,0.15), transparent)"}}/>
        </div>

        {/* ── BY MOMENT — luxury editorial list ── */}
        <div style={{padding:"0 20px"}}>
          {[
            {kicker:"Face Sculpting",  title:"For a clenched jaw",                             meta:"6 min",  route:()=>{setPrevScreen("collection");setScreen("rituals");}},
            {kicker:"Breathwork",      title:"For a heavy chest",                              meta:"4 min",  route:()=>{setPrevScreen("collection");setScreen("home");}},
            {kicker:"Lymphatic",       title:"Before bed",                                     meta:"8 min",  route:()=>{setPrevScreen("collection");setScreen("rituals");}},
            {kicker:"Affirmations",    title:"Before a difficult conversation",                meta:"3 min",  route:()=>{setPrevScreen("collection");setScreen("affirmations");}},
            {kicker:"Breathwork",      title:"When the morning is loud",                       meta:"60 sec", route:()=>{setPrevScreen("collection");setScreen("home");}},
            {kicker:"Self-worth",      title:"When you need to hear it from outside yourself", meta:"5 min",  route:()=>{setPrevScreen("collection");setScreen("affirmations");}},
            {kicker:"Affirmations",    title:"For abundance, said softly",                     meta:"4 min",  route:()=>{setPrevScreen("collection");setScreen("affirmations");}},
            {kicker:"Affirmations",    title:"For the body you are in",                        meta:"6 min",  route:()=>{setPrevScreen("collection");setScreen("affirmations");}},
          ].map((m,i)=>(
            <button key={i} onClick={m.route} className="rhei-press" style={{
              position:"relative",
              background:"linear-gradient(135deg, rgba(196,154,75,0.045) 0%, rgba(14,8,3,0) 60%)",
              border:"none",
              borderBottom:"1px solid rgba(196,154,75,0.09)",
              padding:"20px 16px 20px 22px",
              cursor:"pointer", textAlign:"left", width:"100%",
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:14,
              overflow:"hidden",
            }}>
              {/* Left gold accent line */}
              <div style={{position:"absolute",left:0,top:"18%",bottom:"18%",width:1.5,background:"linear-gradient(180deg,transparent,rgba(196,154,75,0.5) 40%,rgba(196,154,75,0.5) 60%,transparent)"}}/>
              <div style={{flex:1}}>
                <p style={{fontFamily:SF,fontSize:7.5,fontWeight:500,letterSpacing:"0.38em",textTransform:"uppercase",color:"rgba(196,154,75,0.60)",margin:"0 0 6px"}}>{m.kicker}</p>
                <p style={{fontFamily:F,fontSize:22,fontWeight:300,fontStyle:"italic",color:B.vellum,lineHeight:1.18,letterSpacing:"-0.02em",margin:0,fontVariationSettings:"'opsz' 72"}}>{m.title}</p>
              </div>
              <div style={{flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10}}>
                <span style={{fontFamily:SF,fontSize:7.5,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(248,242,229,0.28)",background:"rgba(196,154,75,0.07)",border:"1px solid rgba(196,154,75,0.14)",borderRadius:100,padding:"3px 9px",whiteSpace:"nowrap"}}>{m.meta}</span>
                <ArrowRight size={11} color="rgba(196,154,75,0.40)" strokeWidth={1.5}/>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );

  // ══════════ THE CABINET ══════════
  // The room of objects. First object: The Light (red-light therapy ritual).
  // Anticipation state until the device ships.
  const renderCabinet=()=>(
    <div style={{
      position:"relative",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
      overflow:"hidden",
      padding:"calc(env(safe-area-inset-top, 0px) + 86px) 0 140px",
    }}>
      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:22}}>
          <div style={{flex:1, height:1, background:"rgba(248,242,229,0.10)"}}/>
          <span style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.36em", textTransform:"uppercase", color:"rgba(196,154,75,0.78)"}}>Season &middot; Stillness</span>
          <div style={{flex:1, height:1, background:"rgba(248,242,229,0.10)"}}/>
        </div>
        <h1 style={{fontFamily:F, fontSize:32, fontWeight:300, letterSpacing:"-0.025em", lineHeight:1.05, color:B.cream, margin:"0 0 6px", fontVariationSettings:"'opsz' 144"}}>The Cabinet</h1>
        <p style={{fontFamily:F, fontStyle:"italic", fontSize:14, color:"rgba(248,242,229,0.62)", lineHeight:1.55, margin:"0 0 26px"}}>Objects, slowly chosen. The room of the practice that lives in your hands.</p>

        <div style={{
          position:"relative",
          background:"linear-gradient(180deg, rgba(196,154,75,0.10) 0%, rgba(45,27,14,0.85) 100%)",
          border:"1px solid rgba(196,154,75,0.30)",
          borderRadius:18,
          overflow:"hidden",
          marginBottom:28,
        }}>
          <div style={{
            width:"100%", height:230, position:"relative",
            background:"radial-gradient(circle at 50% 55%, rgba(196,154,75,0.85) 0%, rgba(196,80,40,0.28) 20%, transparent 48%), linear-gradient(180deg, #2D1B0E 0%, #1A0E06 100%)",
            overflow:"hidden",
          }}>
            <div style={{
              position:"absolute", top:14, left:14, zIndex:2,
              background:"rgba(10,6,4,0.55)",
              backdropFilter:"blur(8px)",
              border:"1px solid rgba(196,154,75,0.30)",
              borderRadius:100, padding:"5px 12px",
              fontFamily:SF, fontSize:8.5, fontWeight:500,
              letterSpacing:"0.32em", textTransform:"uppercase",
              color:"rgba(196,154,75,0.95)",
            }}>Arriving &middot; Late Summer</div>
          </div>
          <div style={{padding:"22px 22px"}}>
            <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.34em", textTransform:"uppercase", color:"rgba(196,154,75,0.80)", margin:"0 0 14px"}}>The First Object</p>
            <h2 style={{fontFamily:F, fontSize:30, fontWeight:300, letterSpacing:"-0.025em", color:B.cream, lineHeight:1.05, margin:"0 0 8px", fontVariationSettings:"'opsz' 144"}}>The Light</h2>
            <p style={{fontFamily:F, fontSize:13, color:"rgba(248,242,229,0.62)", lineHeight:1.6, margin:"0 0 18px"}}>A precision ensemble of devices built for your daily ritual. Red-light therapy and EMS technology, designed to stimulate collagen, sculpt the face, and return the body to quiet. Each piece is weighted and warm in the hand — shaped to be used in the practices, and sculpted to live on your bedside table.</p>
            <button onClick={async()=>{
              if(supabase && authUser){
                await supabase.from('profiles').update({notify_light:true}).eq('id',authUser.id).catch(()=>{});
              }
              showToast("You\u2019re on the list. We\u2019ll write when it\u2019s near.");
            }} className="rhei-press" style={{
              width:"100%",
              background:"rgba(248,242,229,0.05)",
              color:B.cream,
              border:"1px solid rgba(196,154,75,0.40)",
              borderRadius:100,
              padding:"13px 22px",
              fontFamily:SF, fontSize:10.5, fontWeight:500,
              letterSpacing:"0.28em", textTransform:"uppercase",
              cursor:"pointer",
            }}>Notify me</button>
          </div>
        </div>

        <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.36em", textTransform:"uppercase", color:"rgba(196,154,75,0.65)", margin:"0 0 14px"}}>Forthcoming objects</p>
        <div style={{display:"flex", gap:10}}>
          {[
            "A stone, shaped to the jaw.",
            "A small light, for the room.",
            "An oil, blended slowly.",
          ].map((t,i)=>(
            <div key={i} style={{
              flex:1, height:110,
              background:"rgba(248,242,229,0.03)",
              border:"1px dashed rgba(248,242,229,0.15)",
              borderRadius:12,
              padding:"14px 12px",
              display:"flex", flexDirection:"column", justifyContent:"flex-end",
            }}>
              <p style={{fontFamily:F, fontStyle:"italic", fontSize:12, color:"rgba(248,242,229,0.45)", lineHeight:1.3, margin:0}}>{t}</p>
              <p style={{fontFamily:SF, fontSize:8, fontWeight:500, letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(196,154,75,0.55)", margin:"6px 0 0"}}>Coming</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ══════════ THE ALMANAC ══════════
  // Editorial layer. The Letter of the Season, past Seasons archived like
  // back issues of a magazine. Where the customer goes to be inside the
  // brand world without needing to do anything.
  const renderAlmanac=()=>(
    <div style={{
      position:"relative",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
      overflow:"hidden",
      padding:"calc(env(safe-area-inset-top, 0px) + 86px) 0 140px",
    }}>
      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:22}}>
          <div style={{flex:1, height:1, background:"rgba(248,242,229,0.10)"}}/>
          <span style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.36em", textTransform:"uppercase", color:"rgba(196,154,75,0.78)"}}>Season &middot; Stillness</span>
          <div style={{flex:1, height:1, background:"rgba(248,242,229,0.10)"}}/>
        </div>
        <h1 style={{fontFamily:F, fontSize:32, fontWeight:300, letterSpacing:"-0.025em", lineHeight:1.05, color:B.cream, margin:"0 0 6px", fontVariationSettings:"'opsz' 144"}}>The Almanac</h1>
        <p style={{fontFamily:F, fontStyle:"italic", fontSize:14, color:"rgba(248,242,229,0.62)", lineHeight:1.55, margin:"0 0 26px"}}>Letters, notes, and small readings &mdash; sent monthly, kept for as long as you want them.</p>

        <div style={{borderTop:"1px solid rgba(248,242,229,0.10)", paddingTop:24}}>
          <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.36em", textTransform:"uppercase", color:"rgba(196,154,75,0.78)", margin:"0 0 8px"}}>The Letter &middot; June</p>
          <h2 style={{fontFamily:F, fontSize:26, fontWeight:300, letterSpacing:"-0.015em", color:B.cream, lineHeight:1.2, margin:"0 0 14px", fontVariationSettings:"'opsz' 96"}}>On Stillness</h2>
          <p style={{fontFamily:F, fontSize:13, color:"rgba(248,242,229,0.68)", lineHeight:1.65, margin:"0 0 12px"}}>It took me a long time to understand that stillness was not a withdrawal from the world. I had been raised to read it as such &mdash; as a pause in the productive day, a small surrender, a thing that good women earned but did not begin with.</p>
          <p style={{fontFamily:F, fontSize:13, color:"rgba(248,242,229,0.68)", lineHeight:1.65, margin:"0 0 18px"}}>What changed was the morning I caught myself half-listening to a vagus-nerve podcast at twice the speed, and realized I had turned even my softness into a task. The optimization had eaten its returns; the body had been waiting.</p>
          <p style={{fontFamily:F, fontStyle:"italic", fontSize:12, color:"rgba(196,154,75,0.75)", margin:0}}>&mdash; for the Season of Stillness</p>
        </div>

        <div style={{marginTop:36}}>
          <p style={{fontFamily:SF, fontSize:9, fontWeight:500, letterSpacing:"0.36em", textTransform:"uppercase", color:"rgba(196,154,75,0.65)", margin:"0 0 14px"}}>Past Seasons</p>
          <div style={{display:"flex", gap:10, overflowX:"auto", paddingBottom:6}}>
            {[
              {n:"05", name:"Brightening"},
              {n:"04", name:"Tenderness"},
              {n:"03", name:"Restoration"},
              {n:"02", name:"Return"},
            ].map((s,i)=>(
              <div key={i} style={{
                flexShrink:0,
                width:100, height:130,
                background:"linear-gradient(180deg, rgba(196,154,75,0.18) 0%, rgba(45,27,14,0.70) 100%)",
                border:"1px solid rgba(196,154,75,0.22)",
                borderRadius:10,
                padding:"14px 12px",
                display:"flex", flexDirection:"column", justifyContent:"flex-end",
              }}>
                <p style={{fontFamily:SF, fontSize:8, fontWeight:500, letterSpacing:"0.34em", color:"rgba(242,232,217,0.45)", margin:"0 0 6px"}}>{s.n}</p>
                <p style={{fontFamily:F, fontSize:14, color:B.cream, lineHeight:1.1, margin:0, fontVariationSettings:"'opsz' 48"}}>{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════ THE HOUSE — modal sheet ══════════
  // Plan management, profile, push, sign out. Opened from the R. monogram.
  const renderHouseSheet=()=>(
    <div style={{
      position:"fixed", inset:0, zIndex:90,
      background:"rgba(8,5,3,0.72)",
      backdropFilter:"blur(12px)",
      display:"flex", alignItems:"flex-end",
    }} onClick={(e)=>{ if(e.target===e.currentTarget) setHouseOpen(false); }}>
      <div style={{
        width:"100%", maxWidth:430, margin:"0 auto",
        background:"linear-gradient(180deg, #2D1B0E 0%, #1A0E06 100%)",
        borderTopLeftRadius:28, borderTopRightRadius:28,
        borderTop:"1px solid rgba(196,154,75,0.30)",
        boxShadow:"0 -20px 60px rgba(0,0,0,0.7)",
        padding:"26px 24px calc(env(safe-area-inset-bottom, 22px) + 26px)",
        maxHeight:"80%", overflowY:"auto",
        position:"relative",
      }}>
        <button onClick={()=>setHouseOpen(false)} aria-label="Close" style={{
          position:"absolute", top:14, right:18,
          background:"none", border:"none", cursor:"pointer",
          color:"rgba(248,242,229,0.45)", fontFamily:F, fontSize:22, zIndex:5,
        }}>&times;</button>
        <div style={{width:42, height:4, borderRadius:3, background:"rgba(242,232,217,0.18)", margin:"0 auto 18px"}}/>
        <h3 style={{fontFamily:F, fontSize:24, fontWeight:300, letterSpacing:"-0.015em", color:B.cream, margin:"0 0 6px"}}>The House</h3>
        <p style={{fontFamily:F, fontStyle:"italic", fontSize:12.5, color:"rgba(248,242,229,0.60)", margin:"0 0 24px"}}>Yours, kept quietly.</p>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(248,242,229,0.08)"}}>
          <span style={{fontFamily:SF, fontSize:11, fontWeight:500, color:B.cream, letterSpacing:"0.04em"}}>Member</span>
          <span style={{fontFamily:SF, fontSize:10, fontWeight:500, color:isPremium?"#F5C878":isInTrial?"#F5C878":"rgba(248,242,229,0.45)", letterSpacing:"0.22em", textTransform:"uppercase"}}>
            {isPremium ? "Active" : isInTrial ? `Trial \u00B7 ${trialDaysLeft}d` : "Not active"}
          </span>
        </div>
        {authUser?.email && (
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(248,242,229,0.08)"}}>
            <span style={{fontFamily:SF, fontSize:11, fontWeight:500, color:B.cream, letterSpacing:"0.04em"}}>Email</span>
            <span style={{fontFamily:SF, fontSize:11, color:"rgba(248,242,229,0.60)"}}>{authUser.email}</span>
          </div>
        )}
        {userName && (
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(248,242,229,0.08)"}}>
            <span style={{fontFamily:SF, fontSize:11, fontWeight:500, color:B.cream, letterSpacing:"0.04em"}}>Name</span>
            <span style={{fontFamily:SF, fontSize:11, color:"rgba(248,242,229,0.60)"}}>{userName}</span>
          </div>
        )}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid rgba(248,242,229,0.08)"}}>
          <span style={{fontFamily:SF, fontSize:11, fontWeight:500, color:B.cream, letterSpacing:"0.04em"}}>Voice</span>
          <span style={{fontFamily:SF, fontSize:10, color:"rgba(196,154,75,0.85)", letterSpacing:"0.22em", textTransform:"uppercase"}}>Lulu</span>
        </div>

        {isPremium ? (
          <button onClick={()=>{ setHouseOpen(false); openBillingPortal && openBillingPortal(); }} className="rhei-press" style={{
            width:"100%", marginTop:18,
            background:"rgba(248,242,229,0.04)",
            border:"1px solid rgba(248,242,229,0.14)",
            color:B.cream,
            borderRadius:14,
            padding:"14px 16px",
            fontFamily:SF, fontSize:11, fontWeight:500,
            letterSpacing:"0.22em", textTransform:"uppercase",
            cursor:"pointer",
          }}>Manage plan &middot; Cancel &middot; Switch</button>
        ) : (
          <button onClick={()=>{ setHouseOpen(false); setScreen("premium"); }} className="rhei-press" style={{
            width:"100%", marginTop:18,
            background:"linear-gradient(135deg, #C49A4B 0%, #D4AD6A 60%, #A07D3A 100%)",
            border:"none",
            color:"#1A0F06",
            borderRadius:14,
            padding:"14px 16px",
            fontFamily:SF, fontSize:11, fontWeight:600,
            letterSpacing:"0.22em", textTransform:"uppercase",
            cursor:"pointer",
          }}>See membership</button>
        )}

        {authUser && (
          <button onClick={()=>{ setHouseOpen(false); signOut && signOut(); }} style={{
            width:"100%", marginTop:10,
            background:"none",
            border:"1px solid rgba(248,242,229,0.10)",
            color:"rgba(248,242,229,0.65)",
            borderRadius:14,
            padding:"12px 16px",
            fontFamily:SF, fontSize:10, fontWeight:500,
            letterSpacing:"0.22em", textTransform:"uppercase",
            cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}><LogOut size={11}/> Sign out</button>
        )}
      </div>
    </div>
  );

  // ══════════ CHECK-IN MODAL (Redesigned) ══════════
  const renderCheckin=()=>(
    <div style={{
      position:"fixed",inset:0,zIndex:100,
      background:"linear-gradient(180deg, #241509 0%, #1A0F06 55%, #0F0905 100%)",
      overflowY:"auto",overflowX:"hidden",
    }}>
      {/* Atmospheric light */}
      <div style={{position:"fixed",top:"25%",left:"50%",width:"110vmin",height:"110vmin",borderRadius:"50%",background:"radial-gradient(circle, rgba(212,173,106,0.13) 0%, rgba(196,154,75,0.04) 35%, transparent 65%)",filter:"blur(28px)",transform:"translate(-50%, -50%)",animation:"rhei-atmosphere-1 22s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"78%",left:"30%",width:"85vmin",height:"85vmin",borderRadius:"50%",background:"radial-gradient(circle, rgba(232,210,164,0.05) 0%, transparent 65%)",filter:"blur(40px)",transform:"translate(-50%, -50%)",animation:"rhei-atmosphere-2 32s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
      <div className="rhei-grain" style={{position:"fixed",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:430,margin:"0 auto",padding:"calc(env(safe-area-inset-top, 0px) + 28px) 24px 80px"}}>
        {/* Close — top right, discreet */}
        <button
          onClick={()=>{setShowCheckin(false);setSelectedCheckin(null);}}
          className="rhei-press"
          style={{position:"absolute",top:"calc(env(safe-area-inset-top, 0px) + 22px)",right:22,background:"none",border:"none",cursor:"pointer",padding:8,zIndex:2,color:"rgba(248,242,229,0.55)",fontFamily:SF,fontSize:10,fontWeight:400,letterSpacing:"0.22em",textTransform:"uppercase"}}>
          Close
        </button>

        {/* Eyebrow + hero question */}
        <div className="rhei-rise rhei-rise-1" style={{marginTop:36,marginBottom:42,textAlign:"left"}}>
          <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.85)",margin:"0 0 22px"}}>How you arrive</p>
          <h2 style={{fontFamily:F,fontSize:"clamp(30px, 8vw, 38px)",fontWeight:300,color:B.vellum,letterSpacing:"-0.018em",lineHeight:1.1,margin:"0 0 14px",maxWidth:360,fontVariationSettings:"'opsz' 60"}}>
            {userName ? `Where are you tonight, ${userName.split(/\s+/)[0]}?` : "Where are you tonight?"}
          </h2>
          <p style={{fontFamily:F,fontSize:14,color:"rgba(248,242,229,0.6)",lineHeight:1.55,margin:"0",maxWidth:340}}>
            Pick the closest. Your answer shapes the ritual.
          </p>
        </div>

        {/* States as elegant hairline-divided list — not radio buttons */}
        <div className="rhei-rise rhei-rise-2" style={{marginBottom:32,borderTop:"1px solid rgba(248,242,229,0.08)"}}>
          {nsStates.map((state, idx)=>{
            const selected = selectedCheckin?.id === state.id;
            return (
              <button
                key={state.id}
                onClick={()=>setSelectedCheckin(state)}
                className="rhei-press"
                style={{
                  width:"100%",
                  background: selected ? "rgba(196,154,75,0.05)" : "transparent",
                  border:"none",
                  borderBottom:"1px solid rgba(248,242,229,0.08)",
                  padding:"22px 4px",
                  cursor:"pointer",
                  display:"flex",
                  alignItems:"center",
                  gap:18,
                  textAlign:"left",
                  position:"relative",
                  transition:"background 0.5s var(--rhei-ease)",
                }}>
                {/* Numeral marker — Roman, low-opacity Fraunces italic */}
                <p style={{
                  fontFamily:F, fontSize:13, fontWeight:400,
                  color: selected ? B.polished : "rgba(248,242,229,0.35)",
                  letterSpacing:"0.04em",
                  margin:0, width:24, flexShrink:0,
                  transition:"color 0.4s var(--rhei-ease)",
                }}>{String(idx+1).padStart(2,"0")}</p>

                <div style={{flex:1,minWidth:0}}>
                  <p style={{
                    fontFamily:F, fontSize:17, fontWeight:400,
                    color: selected ? B.vellum : "rgba(248,242,229,0.78)",
                    letterSpacing:"-0.005em",
                    margin:"0 0 4px",
                    lineHeight:1.25,
                    transition:"color 0.4s var(--rhei-ease)",
                  }}>{state.label}</p>
                  <p style={{
                    fontFamily:F, fontSize:12.5, fontWeight:400,
                    color:"rgba(248,242,229,0.5)",
                    lineHeight:1.4,
                    margin:0,
                  }}>{state.sublabel}</p>
                </div>

                {/* Selected indicator — a single gold hairline mark */}
                <div style={{
                  width: selected ? 24 : 12,
                  height: 1,
                  background: selected ? B.polished : "rgba(248,242,229,0.2)",
                  transition:"width 0.5s var(--rhei-ease), background 0.5s var(--rhei-ease)",
                  flexShrink:0,
                }}/>
              </button>
            );
          })}
        </div>

        {/* CTA — paper button */}
        <div className="rhei-rise rhei-rise-3" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
          <button
            className="rhei-press"
            onClick={()=>{if(selectedCheckin) doCheckin(selectedCheckin);}}
            disabled={!selectedCheckin}
            style={{
              width:"100%", maxWidth:360,
              background: selectedCheckin ? B.paper : "rgba(248,242,229,0.10)",
              border:"none", borderRadius:100, padding:"18px 24px",
              cursor: selectedCheckin ? "pointer" : "not-allowed",
              color: selectedCheckin ? B.espresso : "rgba(248,242,229,0.4)",
              fontFamily:SF, fontSize:14, fontWeight:500, letterSpacing:"0.04em",
              boxShadow: selectedCheckin ? "0 16px 48px -16px rgba(248,242,229,0.3), 0 6px 16px rgba(15,9,5,0.5)" : "none",
              transition:"all 0.4s var(--rhei-ease)",
            }}>
            {selectedCheckin ? "Begin where I am" : "Choose a state"}
          </button>
          <button
            onClick={()=>{setShowCheckin(false);setSelectedCheckin(null);}}
            className="rhei-press"
            style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.5)",fontFamily:SF,fontSize:11,fontWeight:400,letterSpacing:"0.18em",textTransform:"uppercase",padding:8}}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════ MICRO-INTERVENTION MODAL ══════════
  const renderMicro=()=>{
    if(!microActive)return null;
    return(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:`${B.warmBlack}F8`,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:390}}>
          <button onClick={closeMicro} style={{position:"absolute",top:18,right:18,background:"none",border:"none",cursor:"pointer",zIndex:10}}><X size={18} color={B.muted}/></button>
          {microDone ? <GuideComplete message={microMsg} onClose={closeMicro}/> : (
            <>
              {microActive==="sigh"&&<GuideSigh onComplete={()=>completeMicro("NS Score +3 · Cortisol reduced",3)}/>}
              {microActive==="ground"&&<GuideGround onComplete={()=>completeMicro("NS Score +3 · Grounded in the present",3)}/>}
              {microActive==="jaw"&&<GuideJaw onComplete={()=>completeMicro("NS Score +2 · Vagus nerve activated",2)}/>}
              {microActive==="tap"&&<GuideTap onComplete={()=>completeMicro("NS Score +2 · Amygdala calmed",2)}/>}
            </>
          )}
        </div>
      </div>
    );
  };

  // ══════════ RENDER ══════════
  return(
    <div style={container}>
      <style>{GLOBAL_CSS}</style>
      {screen==="home"&&renderHome()}
      {screen==="library"&&renderRituals()}
      {screen==="player"&&renderPlayer()}
      {screen==="rituals"&&renderRituals()}
      {screen==="meditations"&&renderMeditations()}
      {screen==="premium"&&renderPremium()}
      {screen==="progress"&&renderProgress()}
      {screen==="collection"&&(hasAccess?renderCollection():(
        <div style={{position:"relative",minHeight:"100vh",background:"linear-gradient(180deg,#080402 0%,#0F0704 40%,#080402 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"calc(env(safe-area-inset-top,0px) + 86px) 24px 160px"}}>
          <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",height:360,background:"radial-gradient(ellipse at 50% 0%,rgba(196,154,75,0.10) 0%,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{position:"relative",zIndex:1,maxWidth:360,width:"100%",textAlign:"center"}}>
            <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.44em",textTransform:"uppercase",color:"rgba(196,154,75,0.55)",margin:"0 0 18px"}}>The Collection</p>
            <h1 style={{fontFamily:F,fontSize:"clamp(40px,10vw,52px)",fontWeight:300,letterSpacing:"-0.03em",lineHeight:0.95,color:B.vellum,margin:"0 0 28px",fontVariationSettings:"'opsz' 144"}}>Four rooms.<br/>Locked.</h1>
            <p style={{fontFamily:F,fontStyle:"italic",fontSize:15,color:"rgba(248,242,229,0.52)",lineHeight:1.6,margin:"0 0 40px",letterSpacing:"-0.005em"}}>Your trial has ended. Continue your practice with a membership — the rituals, the meditations, the library, all of it.</p>
            <button onClick={()=>setScreen("premium")} style={{background:B.goldGrad,border:"none",borderRadius:100,padding:"16px 40px",fontFamily:SF,fontSize:12,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:B.warmBlack,cursor:"pointer",boxShadow:`0 6px 32px rgba(196,154,75,0.28)`,width:"100%",maxWidth:280,display:"block",margin:"0 auto 16px"}}>Continue with Rhei. &middot; €14.99/mo</button>
            <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(248,242,229,0.30)",padding:"8px 0"}}>Back to home</button>
          </div>
        </div>
      ))}
      {screen==="cabinet"&&renderCabinet()}
      {screen==="almanac"&&(hasAccess?renderAlmanac():(
        <div style={{position:"relative",minHeight:"100vh",background:"linear-gradient(180deg,#0A0604 0%,#100804 38%,#0A0604 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"calc(env(safe-area-inset-top,0px) + 86px) 24px 140px"}}>
          <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",height:320,background:"radial-gradient(ellipse at 50% 0%,rgba(196,154,75,0.08) 0%,transparent 68%)",pointerEvents:"none"}}/>
          <div style={{position:"relative",zIndex:1,maxWidth:360,width:"100%",textAlign:"center"}}>
            <p style={{fontFamily:SF,fontSize:8,fontWeight:600,letterSpacing:"0.44em",textTransform:"uppercase",color:"rgba(196,154,75,0.55)",margin:"0 0 18px"}}>The Almanac</p>
            <h1 style={{fontFamily:F,fontSize:"clamp(34px,9vw,44px)",fontWeight:300,letterSpacing:"-0.025em",lineHeight:1.0,color:B.cream,margin:"0 0 22px",fontVariationSettings:"'opsz' 144"}}>Letters.<br/>Locked.</h1>
            <p style={{fontFamily:F,fontStyle:"italic",fontSize:15,color:"rgba(248,242,229,0.52)",lineHeight:1.6,margin:"0 0 40px"}}>The Almanac holds seasonal letters and small readings. Members receive a new letter each month — to sit with, not rush through.</p>
            <button onClick={()=>setScreen("premium")} style={{background:B.goldGrad,border:"none",borderRadius:100,padding:"16px 40px",fontFamily:SF,fontSize:12,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:B.warmBlack,cursor:"pointer",boxShadow:`0 6px 32px rgba(196,154,75,0.28)`,width:"100%",maxWidth:280,display:"block",margin:"0 auto 16px"}}>Continue with Rhei. &middot; €14.99/mo</button>
            <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(248,242,229,0.30)",padding:"8px 0"}}>Back to home</button>
          </div>
        </div>
      ))}
      {screen==="affirmations"&&<AffirmationsScreen onBack={()=>setScreen("collection")} hasAccess={hasAccess} onUpgrade={()=>setScreen("premium")}/>}
      {screen==="mirror"&&<FaceMirrorMode onClose={()=>setScreen("rituals")} onTransitionToReset={(id)=>startSession(id)} rituals={rituals} isPremium={hasAccess}/>}
      {showCheckin&&renderCheckin()}
      {microActive&&renderMicro()}
      {activeRitual&&<RitualPlayer
        ritual={activeRitual}
        onClose={()=>setActiveRitual(null)}
        onComplete={({ritualType,totalDuration})=>{
          setTotalSessions(t=>t+1);
          setTotalMinutes(t=>t+Math.ceil(totalDuration/60));
          recordSessionCompletion();
          trackEvent('ritual_completed', { ritualType, durationSecs: totalDuration });
          completeSessionOnServer('ritual',ritualType,totalDuration,checkinState?.dominant||null);
        }}
      />}

      {/* ── Toast — luxury bottom-pill (replaces native alert) ────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          onClick={()=>setToast(null)}
          style={{
            position:"fixed",
            bottom:"calc(env(safe-area-inset-bottom, 0px) + 110px)",
            left:"50%", transform:"translateX(-50%)",
            maxWidth:380, width:"calc(100% - 48px)",
            background:"rgba(26,15,6,0.88)",
            backdropFilter:"blur(28px) saturate(1.4)",
            WebkitBackdropFilter:"blur(28px) saturate(1.4)",
            border:"1px solid rgba(228,195,138,0.30)",
            borderRadius:100,
            padding:"15px 24px",
            color:"#F8F2E5",
            fontFamily:F, fontSize:13.5, fontWeight:400, lineHeight:1.45,
            textAlign:"center",
            boxShadow:"0 24px 64px -16px rgba(15,9,5,0.7), 0 4px 14px rgba(15,9,5,0.5)",
            cursor:"pointer",
            zIndex:500,
            animation:"rhei-rise 0.5s var(--rhei-ease-enter) both",
          }}>
          {toast.text}
        </div>
      )}

      {/* ── Name edit modal (replaces native prompt) ──────────────────── */}
      {editingName && (
        <div style={{
          position:"fixed", inset:0, zIndex:400,
          background:"rgba(15,9,5,0.78)",
          backdropFilter:"blur(20px) saturate(1.2)",
          WebkitBackdropFilter:"blur(20px) saturate(1.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"24px",
          animation:"rhei-rise 0.45s var(--rhei-ease-enter) both",
        }} onClick={(e)=>{ if(e.target===e.currentTarget) setEditingName(false); }}>
          <div style={{
            width:"100%", maxWidth:380,
            background:"linear-gradient(180deg,#2D1B0E 0%,#1A0F06 100%)",
            border:"1px solid rgba(228,195,138,0.20)",
            borderRadius:24,
            padding:"32px 28px",
            textAlign:"center",
            boxShadow:"0 40px 80px -24px rgba(0,0,0,0.7)",
          }}>
            <p style={{fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(228,195,138,0.85)", margin:"0 0 16px"}}>Your name</p>
            <h3 style={{fontFamily:F, fontSize:24, fontWeight:300, color:B.vellum, letterSpacing:"-0.015em", margin:"0 0 22px", lineHeight:1.2, fontVariationSettings:"'opsz' 48"}}>How do we say you?</h3>
            <input
              autoFocus
              type="text"
              value={editingNameValue}
              onChange={e=>setEditingNameValue(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'){ setUserName(editingNameValue.trim()); save('userName',editingNameValue.trim()); setEditingName(false); } if(e.key==='Escape') setEditingName(false); }}
              placeholder="first name"
              style={{
                width:"100%",
                background:"rgba(248,242,229,0.05)",
                border:"1px solid rgba(228,195,138,0.30)",
                borderRadius:100,
                padding:"15px 22px",
                color:B.vellum, textAlign:"center",
                fontFamily:F, fontSize:16, fontWeight:400,
                outline:"none", boxSizing:"border-box",
              }}
            />
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginTop:22}}>
              <button
                className="rhei-press"
                onClick={()=>{setUserName(editingNameValue.trim());save('userName',editingNameValue.trim());setEditingName(false);}}
                style={{
                  width:"100%", maxWidth:300,
                  background:B.paper, border:"none", borderRadius:100,
                  padding:"15px 22px", cursor:"pointer",
                  color:B.espresso, fontFamily:SF, fontSize:13, fontWeight:500, letterSpacing:"0.04em",
                  boxShadow:"0 12px 32px -12px rgba(248,242,229,0.3)",
                }}>Save</button>
              <button
                className="rhei-press"
                onClick={()=>setEditingName(false)}
                style={{background:"none", border:"none", cursor:"pointer", color:"rgba(248,242,229,0.5)", fontFamily:SF, fontSize:11, fontWeight:400, letterSpacing:"0.18em", textTransform:"uppercase", padding:8}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Install help modal (replaces native install alert) ──────── */}
      {showInstallHelp && (
        <div style={{
          position:"fixed", inset:0, zIndex:400,
          background:"rgba(15,9,5,0.82)",
          backdropFilter:"blur(20px) saturate(1.2)",
          WebkitBackdropFilter:"blur(20px) saturate(1.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"24px",
          animation:"rhei-rise 0.45s var(--rhei-ease-enter) both",
        }} onClick={(e)=>{ if(e.target===e.currentTarget) setShowInstallHelp(false); }}>
          <div style={{
            width:"100%", maxWidth:380,
            background:"linear-gradient(180deg,#2D1B0E 0%,#1A0F06 100%)",
            border:"1px solid rgba(228,195,138,0.20)",
            borderRadius:24,
            padding:"32px 28px 28px",
            boxShadow:"0 40px 80px -24px rgba(0,0,0,0.7)",
          }}>
            <p style={{fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.32em", textTransform:"uppercase", color:"rgba(228,195,138,0.85)", margin:"0 0 14px", textAlign:"center"}}>Keep RHEI close</p>
            <h3 style={{fontFamily:F, fontSize:24, fontWeight:300, color:B.vellum, letterSpacing:"-0.015em", margin:"0 0 22px", lineHeight:1.2, textAlign:"center", fontVariationSettings:"'opsz' 48"}}>{isIOS ? "Add to your home screen." : "Pin RHEI to your device."}</h3>
            {isIOS ? (
              <ol style={{listStyle:"none", padding:0, margin:"0 0 24px", display:"flex", flexDirection:"column", gap:14, counterReset:"steps"}}>
                {[
                  "Tap the Share icon at the bottom of Safari.",
                  "Scroll and choose 'Add to Home Screen'.",
                  "Tap Add. RHEI lives there now."
                ].map((t,i)=>(
                  <li key={i} style={{display:"flex", gap:14, alignItems:"flex-start"}}>
                    <span style={{flexShrink:0, width:24, height:24, borderRadius:"50%", background:"rgba(228,195,138,0.12)", border:"1px solid rgba(228,195,138,0.30)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, fontSize:12, color:"#E4C38A", fontWeight:500}}>{i+1}</span>
                    <p style={{fontFamily:F, fontSize:14, color:"rgba(248,242,229,0.85)", margin:0, lineHeight:1.5, paddingTop:2}}>{t}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <ol style={{listStyle:"none", padding:0, margin:"0 0 24px", display:"flex", flexDirection:"column", gap:14}}>
                {[
                  "Open this page in Chrome.",
                  "Open the browser menu (three dots).",
                  "Choose 'Install app' or 'Add to Home screen'."
                ].map((t,i)=>(
                  <li key={i} style={{display:"flex", gap:14, alignItems:"flex-start"}}>
                    <span style={{flexShrink:0, width:24, height:24, borderRadius:"50%", background:"rgba(228,195,138,0.12)", border:"1px solid rgba(228,195,138,0.30)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, fontSize:12, color:"#E4C38A", fontWeight:500}}>{i+1}</span>
                    <p style={{fontFamily:F, fontSize:14, color:"rgba(248,242,229,0.85)", margin:0, lineHeight:1.5, paddingTop:2}}>{t}</p>
                  </li>
                ))}
              </ol>
            )}
            <button
              className="rhei-press"
              onClick={()=>setShowInstallHelp(false)}
              style={{
                width:"100%",
                background:B.paper, border:"none", borderRadius:100,
                padding:"15px 22px", cursor:"pointer",
                color:B.espresso, fontFamily:SF, fontSize:13, fontWeight:500, letterSpacing:"0.04em",
                boxShadow:"0 12px 32px -12px rgba(248,242,229,0.3)",
              }}>Got it</button>
          </div>
        </div>
      )}

      {/* ══════════ TOP EDITORIAL NAV ══════════
          Four named rooms — Today, Collection, Cabinet, Almanac — in Inter
          small caps with a hairline underline marking the active room.
          The R. monogram in the corner opens the House sheet (plan, account).
          Hidden during full-screen overlays (player, mirror, premium, checkin,
          micro intervention, ritual player) so the immersive moments are not
          framed by nav chrome.

          The Collection nav item also reads as active when the user is inside
          one of its sub-rooms (rituals, meditations, affirmations, library) so
          she always knows where she is in the house. */}
      {!["player","mirror","premium"].includes(screen) && !showCheckin && !microActive && !activeRitual && (
        <div style={{
          position:"fixed", top:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:430,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"calc(env(safe-area-inset-top, 0px) + 18px) 22px 14px",
          background:"linear-gradient(180deg, rgba(10,6,4,0.94) 0%, rgba(10,6,4,0.78) 60%, rgba(10,6,4,0) 100%)",
          backdropFilter:"blur(8px)",
          WebkitBackdropFilter:"blur(8px)",
          zIndex:55,
          pointerEvents:"auto",
        }}>
          <div style={{display:"flex", gap:14, alignItems:"baseline"}}>
            {[
              {id:"home", label:"Today"},
              {id:"collection", label:"Collection"},
              {id:"cabinet", label:"Cabinet"},
              {id:"almanac", label:"Almanac"},
            ].map(n => {
              const active = n.id===screen
                || (n.id==="collection" && ["rituals","meditations","affirmations","library"].includes(screen));
              return (
                <button key={n.id} onClick={()=>{setPrevScreen(null);setScreen(n.id);}} className="rhei-press" style={{
                  background:"none", border:"none", cursor:"pointer",
                  padding:"4px 0", position:"relative",
                  fontFamily:SF, fontSize:8.5, fontWeight:500,
                  letterSpacing:"0.28em", textTransform:"uppercase",
                  color: active ? B.gold : "rgba(248,242,229,0.50)",
                  transition:"color .2s ease",
                  whiteSpace:"nowrap",
                }}>
                  {n.label}
                  {active && <div style={{position:"absolute", bottom:-3, left:"50%", transform:"translateX(-50%)", width:12, height:1, background:B.gold}}/>}
                </button>
              );
            })}
          </div>

          {/* The R. monogram — opens The House sheet */}
          <button onClick={()=>setHouseOpen(true)} className="rhei-press" aria-label="The House" style={{
            width:30, height:30, borderRadius:"50%",
            background:"rgba(196,154,75,0.10)",
            border:"1px solid rgba(196,154,75,0.30)",
            cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:B.gold,
            fontFamily:F, fontSize:13, fontWeight:400,
            padding:0,
          }}>R<span style={{fontSize:8, verticalAlign:"super"}}>.</span></button>
        </div>
      )}

      {houseOpen && renderHouseSheet()}
    </div>
  );
}
