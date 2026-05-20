import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronLeft, Moon, Sun, Wind, Shield, Home, Headphones, BarChart3, Heart, Clock, Check, Flame, X, ArrowRight, Brain, Activity, Zap, Sunset, Timer, Waves, RefreshCw, Sparkles, Lock, Crown, User, Hand, Mail, LogOut, MessageCircle, Camera, Volume2, VolumeX } from "lucide-react";
import { supabase } from "./supabaseClient";
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
import AffirmationsScreen from "./AffirmationsScreen";
import FaceMirrorMode from "./FaceMirrorMode";

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
  { id:1, title:"Soft Awakening", subtitle:"Before the day begins", duration:179, icon:Sun,     accent:"#D9A98C", description:"Sets your nervous system baseline before anything else can. Three minutes of breathing — extended exhale, somatic grounding, vagal activation. Best done before your phone.",                                                technique:"Extended exhale · Somatic grounding · Vagal humming",            bestFor:"First minutes after waking",                              timeOfDay:"morning", audioFile:"/audio/morning-reset.mp3",       occasion:"morning"  },
  { id:2, title:"Inner Warmth",    subtitle:"Composure before something asks for it",       duration:200, icon:Shield,  accent:"#D4AD6A", description:"Activates vagal tone and grounds the nervous system before high-stakes moments. The difference between responding and reacting.",                                                                                  technique:"Physiological sigh · Somatic grounding · Cognitive anchor",     bestFor:"Five minutes before any demanding interaction",          timeOfDay:"any",     audioFile:"/audio/pre-meeting-reset.mp3",   occasion:"event"    },
  { id:3, title:"Evening Melt",    subtitle:"From performance to presence",                  duration:234, icon:Sunset,  accent:"#C99656", description:"Releases the activation that lingers after a workday. Designed for the shift between professional and personal life — so you don't bring it home.",                                                              technique:"Progressive release · Body scan · Identity shift",              bestFor:"The commute home, or before walking through the door",   timeOfDay:"evening", audioFile:"/audio/transition-reset.mp3",    occasion:"evening"  },
  { id:4, title:"Emotional Release",subtitle:"Put down what you're still holding",           duration:194, icon:Wind,    accent:"#C4786A", description:"After a difficult conversation, the body stays physiologically activated long after the moment ends. This is how you actually leave it.",                                                                          technique:"Bilateral stimulation · Physiological sigh · Self-compassion",  bestFor:"After difficult conversations or anything emotionally costly", timeOfDay:"any", audioFile:"/audio/post-conflict-reset.mp3", occasion:"recovery" },
  { id:5, title:"Return to Self",  subtitle:"Wherever you are",                              duration:172, icon:RefreshCw,accent:"#B88940", description:"The foundational reset. No specific trigger required — use it whenever you've drifted or tensed. Three minutes, anywhere.",                                                                                       technique:"Diaphragmatic breathing · Body awareness · Vagal activation",   bestFor:"Any moment you need to come back to center",             timeOfDay:"any",     audioFile:"/audio/general-reset.mp3",       occasion:"any"      },
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
  { id:"morning-sculpt",       title:"Morning Sculpt",         subtitle:"The face you bring into the day",                  ritualIds:["gua-sha","face-lift"],          accent:"#D4AD6A" },
  { id:"hotel-reset",          title:"Hotel Reset",            subtitle:"Long flight, foreign bathroom, full presence in an hour", ritualIds:["lymphatic","eye-revival"], accent:"#8A9BAF" },
  { id:"before-dinner",        title:"Before Dinner",          subtitle:"The half hour between the day and the table",      ritualIds:["pre-event","gua-sha"],          accent:"#C49A4B" },
  { id:"post-flight",          title:"Post-Flight Drainage",   subtitle:"When the body forgot what time zone it's in",      ritualIds:["lymphatic","belly-flow"],       accent:"#7A8B99" },
  { id:"evening-softening",    title:"Evening Softening",      subtitle:"Putting the day down before bed",                  ritualIds:["buccal","belly-flow"],          accent:"#A08BAA" },
  { id:"pre-event-glow",       title:"Pre-Event Glow",         subtitle:"For the room you're about to walk into",           ritualIds:["pre-event","face-lift"],        accent:"#D4AD6A" },
  { id:"jaw-release",          title:"Jaw Release",            subtitle:"For the day that asked too much",                  ritualIds:["buccal"],                       accent:"#A07D3A" },
  { id:"sunday-restoration",   title:"Sunday Restoration",     subtitle:"A longer practice for when there's time",          ritualIds:["belly-flow","lymphatic","gua-sha"], accent:"#7A8674" },
  { id:"emotional-decompress", title:"Emotional Decompression",subtitle:"For after the hard conversation",                  ritualIds:["buccal","eye-revival"],         accent:"#C4786A" },
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
    duration: "6 min", isPremium: false, svgFile: "/svgs/gua-sha-zones.svg", accent: "#D4AD6A",
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
    duration: "6 min", isPremium: false, svgFile: "/svgs/lymphatic-paths.svg", accent: "#8A9BAF",
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
    duration: "7 min", isPremium: false, svgFile: "/svgs/face-lifting-points.svg", accent: "#E8C088",
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
    duration: "5 min", isPremium: false, svgFile: "/svgs/face-base.svg", accent: "#C4786A",
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
    duration: "4 min", isPremium: true, svgFile: "/svgs/face-base.svg", accent: "#F5D89A",
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
    duration: "5 min", isPremium: true, svgFile: "/svgs/face-base.svg", accent: "#A08BAA",
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
    duration: "6 min", isPremium: false, svgFile: "/svgs/face-base.svg", accent: "#B88940",
    description: "A real lymphatic drainage sequence for the abdomen — the kind massage therapists charge $200/hour for. Releases trapped fluid, eases bloating, and signals the gut that the bracing can stop. Follows the actual colonic and inguinal lymph pathways. Best done on an empty or near-empty stomach, lying down.",
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
const greetUser = (name) => { const h=new Date().getHours(); const g=h<12?"Good morning":h<17?"Good afternoon":"Good evening"; return name?`${g}, ${name}`:g; };
const greetShort = () => { const h=new Date().getHours(); if(h<10)return"This morning"; if(h<14)return"This midday"; if(h<18)return"This afternoon"; return"This evening"; };
const timeCtx = () => { const h=new Date().getHours(); if(h<6)return"night"; if(h<10)return"morning"; if(h<14)return"midday"; if(h<18)return"afternoon"; if(h<21)return"evening"; return"night"; };
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
      <p style={{fontSize:12,color:B.muted,fontStyle:"italic",fontFamily:F,lineHeight:1.5,maxWidth:260,marginBottom:8}}>{sense.prompt}</p>
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
      <p style={{fontSize:12,color:B.muted,fontStyle:"italic",fontFamily:F,lineHeight:1.5,maxWidth:270}}>{js.instruction}</p>
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
      <p style={{fontSize:12,color:B.muted,fontStyle:"italic",fontFamily:F}}>Slow, gentle, rhythmic</p>
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
      <p style={{fontSize:13,color:B.muted,fontStyle:"italic",margin:"0 0 8px",fontFamily:F}}>Your face, your nervous system — both listened.</p>
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
      if (voiceAudioRef.current) { try { voiceAudioRef.current.pause(); } catch {} voiceAudioRef.current = null; }
      return;
    }
    if (step < 0 || step >= totalSteps) return;
    const stepData = ritual.steps[step];
    if (!stepData) return;
    const text = `${stepData.title}. ${stepData.instruction || ""}`.trim();

    // Synchronously tear down anything still going from the previous step
    try { window.speechSynthesis?.cancel(); } catch {}
    if (voiceAudioRef.current) { try { voiceAudioRef.current.pause(); } catch {} voiceAudioRef.current = null; }

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
    const audio = new Audio(url);
    audio.volume = 0.95;
    audio.preload = "auto";
    voiceAudioRef.current = audio;

    audio.addEventListener("error", () => {
      if (stopped) return;
      // Genuine load failure — fall back to TTS
      if (voiceAudioRef.current === audio) voiceAudioRef.current = null;
      playTts();
    });

    audio.play().catch(() => {
      // play() rejected. Wait one tick — if neither error nor playback fires,
      // and we're still the current audio and we haven't been stopped, fall to TTS.
      setTimeout(() => {
        if (stopped) return;
        if (voiceAudioRef.current === audio && audio.paused && audio.currentTime === 0) {
          if (voiceAudioRef.current === audio) voiceAudioRef.current = null;
          playTts();
        }
      }, 400);
    });

    return () => {
      stopped = true;
      try { audio.pause(); } catch {}
      try { audio.src = ""; } catch {}   // Force release of any in-flight network request
      if (voiceAudioRef.current === audio) voiceAudioRef.current = null;
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
    timerRef.current = setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1) { clearInterval(timerRef.current); return 0; }
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
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
            <p style={{fontSize:13,color:B.muted,fontStyle:"italic",margin:"0 0 16px"}}>{ritual.subtitle}</p>
          </div>
          <div style={{width:"100%",height:220,borderRadius:20,background:B.card,border:`1px solid ${B.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,overflow:"hidden"}}>
            <RitualIllustration
              ritualId={ritual.id}
              zone={ritual.id==="gua-sha"?"jawline":ritual.id==="lymphatic"?"nodes":ritual.id==="belly-flow"?"navel":"cheeks"}
              size={160}
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
          <p style={{fontSize:15,color:B.creamMuted,fontStyle:"italic",margin:"0 0 6px",fontFamily:F}}>Your face is softer, more open, and more lifted.</p>
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

        <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:4,marginTop:8}}>{ritual.title}</p>
        <p style={{fontSize:12,color:B.muted,marginBottom:28,fontFamily:SF}}>Step {step+1} of {totalSteps}</p>

        {/* Progress dots */}
        <div style={{display:"flex",gap:4,marginBottom:28,flexWrap:"wrap",justifyContent:"center"}}>
          {ritual.steps.map((_,i)=>(<div key={i} style={{width:i===step?20:8,height:4,borderRadius:2,background:i<step?B.gold:i===step?B.goldLight:`${B.gold}20`,transition:"all 0.4s"}}/>))}
        </div>

        {/* Face illustration + timer */}
        <div style={{position:"relative",width:"100%",display:"flex",justifyContent:"center",alignItems:"center",marginBottom:16}}>
          {/* Timer ring top-right of illustration */}
          <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <RitualIllustration ritualId={ritual.id} zone={currentStep.zone||"full"} size={170}/>
            {/* Floating timer pill */}
            <div style={{position:"absolute",bottom:8,right:-8,background:B.card,border:`1px solid ${B.borderActive}`,borderRadius:20,padding:"5px 12px",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 16px ${B.warmBlack}60`}}>
              <div style={{position:"relative",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ring progress={pct} size={28} sw={2.5}/>
                <span style={{fontSize:9,color:B.cream,fontWeight:500,zIndex:2,fontFamily:SF}}>{timeLeft}</span>
              </div>
              <span style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF}}>sec</span>
            </div>
          </div>
        </div>

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

  // When auth state changes mid-flow (user clicks magic link in another tab/window),
  // advance them to the explainer screens automatically
  useEffect(() => {
    if (authUser && (step === "splash" || step === "email" || step === "linkSent")) {
      setStep(0);
    }
  }, [authUser]);

  const sendMagicLink = async () => {
    const e = email.trim();
    if (!e) return;
    if (!supabase) {
      setAuthError("Account setup isn't available right now. You can continue without one.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) {
        setAuthError(error.message || "Couldn't send the link. Try again.");
      } else {
        setStep("linkSent");
      }
    } catch (err) {
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
              fontFamily:F, fontStyle:"italic", fontSize:16, fontWeight:400,
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
              I've been here before
            </button>

            <button
              className="rhei-press"
              onClick={()=>setStep(0)}
              style={{
                background:"none", border:"none", cursor:"pointer",
                color:"rgba(248,242,229,0.5)",
                fontFamily:SF, fontSize:11, fontWeight:400,
                letterSpacing:"0.18em", textTransform:"uppercase",
                padding:"6px",
                marginTop:4,
                textShadow:"0 1px 6px rgba(0,0,0,0.5)",
              }}>
              Just look around
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
              fontFamily:F, fontStyle:"italic", fontSize:15, fontWeight:400,
              color:"rgba(248,242,229,0.7)",
              lineHeight:1.55,
              margin:"0 auto 44px", maxWidth:300,
            }}>{isSignup ? "We'll send a link. No passwords." : "The email you came in with."}</p>

            {/* Email input — bark surface, hairline, Fraunces italic placeholder */}
            <div className="rhei-rise rhei-rise-4" style={{position:"relative", maxWidth:360, margin:"0 auto"}}>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")sendMagicLink();}}
                placeholder="you@yours.com"
                autoFocus
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
                  transition:"border-color 0.4s var(--rhei-ease), background 0.4s var(--rhei-ease)",
                }}
              />
            </div>

            {authError && (
              <p style={{fontSize:13, color:B.rouge, fontFamily:F, fontStyle:"italic", margin:"16px auto 0", maxWidth:300, lineHeight:1.5}}>{authError}</p>
            )}

            <div className="rhei-rise rhei-rise-5" style={{marginTop:18, display:"flex", flexDirection:"column", alignItems:"center", gap:14}}>
              <button
                className="rhei-press"
                onClick={sendMagicLink}
                disabled={!email.trim() || authLoading}
                style={{
                  width:"100%", maxWidth:360,
                  background: email.trim() && !authLoading ? B.paper : "rgba(248,242,229,0.10)",
                  border:"none", borderRadius:100, padding:"18px 24px",
                  cursor: email.trim() && !authLoading ? "pointer" : "not-allowed",
                  color: email.trim() && !authLoading ? B.espresso : "rgba(248,242,229,0.4)",
                  fontFamily:SF, fontSize:14, fontWeight:500, letterSpacing:"0.04em",
                  boxShadow: email.trim() && !authLoading ? "0 16px 48px -16px rgba(248,242,229,0.3), 0 6px 16px rgba(15,9,5,0.5)" : "none",
                  opacity: authLoading ? 0.6 : 1,
                  transition:"all 0.4s var(--rhei-ease)",
                }}>
                {authLoading ? "Sending the link…" : "Send my link"}
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
                Set this up later
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
              fontFamily:F, fontStyle:"italic", fontSize:15, fontWeight:400,
              color:"rgba(248,242,229,0.7)",
              lineHeight:1.6,
              margin:"0 auto 14px", maxWidth:340,
            }}>
              The link is on its way to <span style={{color:B.vellum, fontStyle:"normal"}}>{email}</span>.
            </p>
            <p className="rhei-rise rhei-rise-3" style={{
              fontFamily:F, fontStyle:"italic", fontSize:13, fontWeight:400,
              color:"rgba(248,242,229,0.5)",
              lineHeight:1.6,
              margin:"0 auto 44px", maxWidth:320,
            }}>Open it from this device. It may take a moment.</p>

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
                Use a different email
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
                Look around without one
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
              fontFamily:F, fontStyle:"italic",
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
              fontFamily:F, fontStyle:"italic", fontSize:16, fontWeight:400,
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
            fontFamily:F, fontStyle:"italic", fontSize:15, fontWeight:400,
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

  // Navigation
  const [screen,setScreen]=useState("home");
  const [activeSession,setActiveSession]=useState(null);
  const [isPlaying,setIsPlaying]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [audioDuration,setAudioDuration]=useState(0);
  const [completedToday,setCompletedToday]=useState(()=>load('completedToday',[]));
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
  const [microActive,setMicroActive]=useState(null);
  const [microDone,setMicroDone]=useState(false);
  const [microMsg,setMicroMsg]=useState("");
  const [activeRitual,setActiveRitual]=useState(null);
  const [showInstallPrompt,setShowInstallPrompt]=useState(false);
  const [installDismissed,setInstallDismissed]=useState(()=>load('installDismissed',false));
  const [isIOS]=useState(()=>/iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isStandalone]=useState(()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true);
  const [checkoutLoading,setCheckoutLoading]=useState(false);

  // Auth state (Supabase)
  const [authUser,setAuthUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(!!supabase);
  const [authEmail,setAuthEmail]=useState('');
  const [authSent,setAuthSent]=useState(false);
  const [authError,setAuthError]=useState('');

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
      if(session?.user?.email){
        // Check subscription in Supabase
        fetch('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:session.user.email})})
          .then(r=>r.json())
          .then(data=>{ if(data.isPremium){setIsPremium(true);save('isPremium',true);save('premiumPlan',data.plan);} })
          .catch(()=>{});
        save('customerEmail',session.user.email);
        if(!userName && session.user.user_metadata?.name){setUserName(session.user.user_metadata.name);save('userName',session.user.user_metadata.name);}
      }
      setAuthLoading(false);
    });
    const {data:{subscription:authSub}}=supabase.auth.onAuthStateChange((_event,session)=>{
      setAuthUser(session?.user||null);
      if(session?.user?.email){
        fetch('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:session.user.email})})
          .then(r=>r.json())
          .then(data=>{ if(data.isPremium){setIsPremium(true);save('isPremium',true);} })
          .catch(()=>{});
        save('customerEmail',session.user.email);
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
          // If verify fails, still unlock (better UX, can re-verify later)
          setIsPremium(true);save('isPremium',true);
        });
      // Clean URL
      window.history.replaceState({},'','/');
    } else if(payment==='cancelled'){
      window.history.replaceState({},'','/');
    }
  },[]);

  // Stripe checkout handler
  const handleCheckout=async(plan)=>{
    setCheckoutLoading(true);
    try{
      const userEmail=authUser?.email||load('customerEmail','');
      const res=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,email:userEmail||undefined})});
      const data=await res.json();
      if(data.url){window.location.href=data.url;}
      else{alert('Something went wrong. Please try again.');setCheckoutLoading(false);}
    }catch(err){
      alert('Connection error. Please try again.');setCheckoutLoading(false);
    }
  };

  const installApp=async()=>{
    if(deferredPromptRef.current){deferredPromptRef.current.prompt();deferredPromptRef.current=null;setShowInstallPrompt(false);}
    else if(isIOS){alert("To add RHEI to your home screen:\n\n1. Tap the Share button (square with arrow) at the bottom of Safari\n2. Scroll down and tap \"Add to Home Screen\"\n3. Tap \"Add\"");}
    else{alert("To install RHEI:\n\nOpen this page in Chrome or Safari, then use your browser menu to \"Add to Home Screen\" or \"Install App\".");}
  };
  const dismissInstall=()=>{setShowInstallPrompt(false);setInstallDismissed(true);save('installDismissed',true);};

  // Persist
  useEffect(()=>{save('completedToday',completedToday);},[completedToday]);
  useEffect(()=>{save('streak',streak);},[streak]);
  useEffect(()=>{save('meditationStreak',meditationStreak);},[meditationStreak]);
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
    setActiveSession(id);setElapsed(0);setIsPlaying(false);setShowComplete(false);setAudioLoading(true);setScreen("player");
    if(audioRef.current){audioRef.current.pause();audioRef.current.src='';}
    const a=new Audio(s.audioFile);a.preload='auto';audioRef.current=a;
    a.addEventListener('loadedmetadata',()=>{setAudioDuration(a.duration);setAudioLoading(false);});
    a.addEventListener('canplay',()=>setAudioLoading(false));
    a.addEventListener('ended',()=>{
      cancelAnimationFrame(animRef.current);setIsPlaying(false);setElapsed(a.duration);
      if(!completedToday.includes(id)){
        setCompletedToday(c=>[...c,id]);setTotalSessions(t=>t+1);setTotalMinutes(t=>t+Math.ceil(s.duration/60));
        setMeditationStreak(n=>n+1);
        // Persist to Supabase (fire and forget via helper)
        completeSessionOnServer('meditation',null,Math.round(a.duration));
      }
      setShowComplete(true);
    });
    a.addEventListener('error',()=>setAudioLoading(false));
  };

  const togglePlay=()=>{
    if(!audioRef.current)return;
    if(isPlaying){audioRef.current.pause();cancelAnimationFrame(animRef.current);setIsPlaying(false);}
    else{audioRef.current.play().then(()=>{setIsPlaying(true);animRef.current=requestAnimationFrame(trackTime);}).catch(()=>{});}
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
  if(!onboarded) {
    return <Onboarding authUser={authUser} onComplete={(name)=>{setUserName(name);setOnboarded(true);save('onboarded',true);}} />;
  }

  // ══════════ TODAY ══════════
  const renderHome=()=>{
    const tc = timeCtx();
    const arc = getArc(checkinDone?checkinState:null, tc);
    const ritualLocked = arc.ritual.isPremium && !isPremium;
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
      padding:"calc(env(safe-area-inset-top, 0px) + 28px) 24px 140px",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #2D1B0E 0%, #1A0F06 50%, #0F0905 100%)",
      overflow:"hidden",
    }}>
      {/* Cinematic golden-hour stack — the room you walk into */}
      <GoldenHourAtmosphere top="18%" left="60%" intensity={0.85} />

      {/* Content sits above atmosphere */}
      <div style={{position:"relative", zIndex:1, maxWidth:430, margin:"0 auto"}}>

        {/* ── Top eyebrow row: tiny brand + premium chip ── */}
        <div className="rhei-rise rhei-rise-1" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:48}}>
          <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(248,242,229,0.55)",margin:0}}>RHEI · {tc === "night" ? "Tonight" : tc === "morning" ? "Today" : tc === "evening" ? "This evening" : "Now"}</p>
          <button
            className="rhei-press"
            onClick={()=>setScreen("premium")}
            style={{background:"rgba(248,242,229,0.04)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:`1px solid ${isPremium?"rgba(196,154,75,0.35)":"rgba(248,242,229,0.10)"}`,borderRadius:100,padding:"5px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <Crown size={10} color={isPremium?B.polished:"rgba(248,242,229,0.55)"} strokeWidth={1.5}/>
            <span style={{fontSize:9,color:isPremium?B.polished:"rgba(248,242,229,0.65)",fontFamily:SF,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:500}}>{isPremium?"Member":"Enter"}</span>
          </button>
        </div>

        {/* ── Cinematic hero — greeting + daily message ── */}
        <div className="rhei-rise rhei-rise-2" style={{marginBottom:52}}>
          <p style={{fontFamily:F,fontSize:15,fontStyle:"italic",color:"rgba(248,242,229,0.55)",margin:"0 0 16px",letterSpacing:"-0.005em"}}>{greeting}</p>
          <h1 style={{fontFamily:F,fontSize:"clamp(34px, 8.5vw, 44px)",fontWeight:300,color:B.vellum,letterSpacing:"-0.02em",lineHeight:1.05,margin:"0 0 14px",maxWidth:380,fontVariationSettings:"'opsz' 60"}}>{dailyMessage.h}</h1>
          <p style={{fontFamily:F,fontStyle:"italic",fontSize:15,fontWeight:400,color:"rgba(248,242,229,0.6)",lineHeight:1.55,margin:0,maxWidth:340}}>{dailyMessage.s}</p>
        </div>

        {/* ── PWA install whisper (low priority, easy to dismiss) ── */}
        {showInstallPrompt && !isStandalone && (
          <div className="rhei-rise rhei-rise-3" style={{background:"rgba(248,242,229,0.04)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(248,242,229,0.08)",borderRadius:18,padding:"14px 18px",marginBottom:24,display:"flex",alignItems:"center",gap:14,position:"relative"}}>
            <button onClick={dismissInstall} style={{position:"absolute",top:10,right:10,background:"none",border:"none",cursor:"pointer",padding:4}}><X size={11} color="rgba(248,242,229,0.4)"/></button>
            <button onClick={installApp} style={{flex:1,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,paddingRight:18}}>
              <p style={{fontFamily:F,fontSize:13,color:B.paper,margin:"0 0 2px"}}>Keep RHEI close.</p>
              <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.55)",margin:0}}>Add to home screen.</p>
            </button>
            <ArrowRight size={13} color={B.polished}/>
          </div>
        )}

        {/* ── Mood pathway OR personalized state echo ── */}
        {personalizedMsg ? (
          <div className="rhei-rise rhei-rise-3" style={{marginBottom:36}}>
            <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.7)",margin:"0 0 14px"}}>For where you are</p>
            <div style={{background:"rgba(248,242,229,0.04)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(196,154,75,0.18)",borderRadius:20,padding:"22px 22px 18px"}}>
              <p style={{fontFamily:F,fontSize:18,fontStyle:"italic",color:B.vellum,lineHeight:1.4,margin:"0 0 16px",fontWeight:300}}>{personalizedMsg}</p>
              <button
                className="rhei-press"
                onClick={()=>{setCheckinDone(false);setCheckinState(null);}}
                style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.55)",fontFamily:SF,fontSize:10,fontWeight:400,letterSpacing:"0.18em",textTransform:"uppercase",padding:0}}>
                Change state →
              </button>
            </div>
          </div>
        ) : (
          <div className="rhei-rise rhei-rise-3" style={{marginBottom:36}}>
            <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.7)",margin:"0 0 18px"}}>How you arrive</p>
            <button
              className="rhei-press"
              onClick={()=>setShowCheckin(true)}
              style={{width:"100%",background:"rgba(248,242,229,0.04)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(248,242,229,0.10)",borderRadius:20,padding:"22px 22px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
              <div>
                <p style={{fontFamily:F,fontSize:17,color:B.vellum,margin:"0 0 4px",fontWeight:400,lineHeight:1.3}}>Tell me how you arrived.</p>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:12,color:"rgba(248,242,229,0.55)",margin:0,lineHeight:1.4}}>Eight ways to begin. Pick the closest.</p>
              </div>
              <ArrowRight size={16} color={B.polished} strokeWidth={1.5}/>
            </button>
          </div>
        )}

        {/* ── FEATURED RITUAL — oversized, editorial, the daily anchor ── */}
        <div className="rhei-rise rhei-rise-4" style={{marginBottom:44}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:18}}>
            <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.7)",margin:0}}>Today's Ritual</p>
            <button onClick={()=>setScreen("rituals")} className="rhei-press" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.55)",fontFamily:SF,fontSize:10,fontWeight:400,letterSpacing:"0.18em",textTransform:"uppercase",padding:0}}>
              All →
            </button>
          </div>
          <button
            onClick={()=>{if(ritualLocked){setScreen("premium");}else{setActiveRitual(generateAdaptiveRitual(arc.ritual,checkinState));}}}
            className="rhei-press"
            style={{width:"100%",background:"linear-gradient(180deg, rgba(58,37,22,0.65) 0%, rgba(36,21,9,0.85) 100%)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(196,154,75,0.22)",borderRadius:24,padding:"24px 22px 22px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",boxShadow:"0 24px 60px -20px rgba(15,9,5,0.7), 0 8px 20px rgba(15,9,5,0.4)"}}>
            {/* Soft warm light bleed in upper-right */}
            <div style={{position:"absolute",top:"-20%",right:"-15%",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle, rgba(212,173,106,0.18) 0%, transparent 60%)",filter:"blur(20px)",pointerEvents:"none"}}/>
            {/* Embossed FaceGuide */}
            <div style={{position:"absolute",top:-12,right:-18,width:160,height:200,opacity:0.7,pointerEvents:"none"}}>
              <RitualIllustration ritualId={arc.ritual.id} zone={ritualZone} size={120}/>
            </div>
            {ritualLocked && (
              <div style={{position:"absolute",top:14,left:14,display:"flex",alignItems:"center",gap:5,background:"rgba(196,154,75,0.14)",backdropFilter:"blur(8px)",padding:"4px 9px",borderRadius:100,border:"1px solid rgba(196,154,75,0.25)"}}>
                <Lock size={8} color={B.polished} strokeWidth={2}/>
                <span style={{fontSize:8,letterSpacing:"0.18em",color:B.polished,fontFamily:SF,textTransform:"uppercase",fontWeight:500}}>Member</span>
              </div>
            )}
            <div style={{position:"relative",zIndex:2,maxWidth:"68%"}}>
              <p style={{fontFamily:SF,fontSize:9,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.8)",margin:"0 0 12px"}}>{arc.ritual.duration}</p>
              <h2 style={{fontFamily:F,fontSize:"clamp(26px, 7vw, 32px)",fontWeight:300,color:B.vellum,letterSpacing:"-0.018em",lineHeight:1.08,margin:"0 0 8px",fontVariationSettings:"'opsz' 60"}}>{arc.ritual.title}</h2>
              <p style={{fontFamily:F,fontStyle:"italic",fontSize:13,color:"rgba(248,242,229,0.6)",margin:"0 0 22px",lineHeight:1.5}}>{arc.ritual.subtitle}</p>
              <div style={{display:"inline-flex",alignItems:"center",gap:10,background:B.paper,borderRadius:100,padding:"11px 22px",boxShadow:"0 8px 24px -8px rgba(248,242,229,0.25), 0 4px 12px rgba(15,9,5,0.4)"}}>
                <span style={{fontFamily:SF,fontSize:13,color:B.espresso,fontWeight:500,letterSpacing:"0.04em"}}>{ritualLocked ? "Enter the collection" : "Begin"}</span>
                <ArrowRight size={13} color={B.espresso} strokeWidth={2}/>
              </div>
            </div>
          </button>
        </div>

        {/* ── EDITORIAL COLLECTIONS — horizontal scroll ── */}
        <div className="rhei-rise rhei-rise-4" style={{marginBottom:44}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:18,paddingRight:0}}>
            <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.7)",margin:0}}>Curated</p>
            <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.45)",margin:0}}>Swipe through</p>
          </div>
          <div style={{display:"flex",gap:12,overflowX:"auto",scrollSnapType:"x mandatory",scrollPaddingLeft:0,margin:"0 -24px",padding:"0 24px 8px",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
            <style>{`.rhei-collection-strip::-webkit-scrollbar{display:none;}`}</style>
            {collections.slice(0,6).map((c, i)=>{
              const firstRitual = rituals.find(r => r.id === c.ritualIds[0]);
              const locked = firstRitual?.isPremium && !isPremium;
              return (
                <button
                  key={c.id}
                  className="rhei-press"
                  onClick={()=>{if(firstRitual){if(locked){setScreen("premium");}else{setActiveRitual(generateAdaptiveRitual(firstRitual,checkinState));}}}}
                  style={{flex:"0 0 auto",width:200,scrollSnapAlign:"start",background:`linear-gradient(180deg, ${c.accent}1A 0%, rgba(36,21,9,0.85) 100%)`,backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(248,242,229,0.08)",borderRadius:20,padding:"18px 16px 16px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",minHeight:160,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                  {/* Soft accent glow */}
                  <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle, ${c.accent}26 0%, transparent 60%)`,filter:"blur(16px)",pointerEvents:"none"}}/>
                  <div style={{position:"relative",zIndex:1}}>
                    <p style={{fontFamily:SF,fontSize:9,fontWeight:500,letterSpacing:"0.22em",textTransform:"uppercase",color:c.accent,margin:"0 0 8px",opacity:0.9}}>{c.ritualIds.length} ritual{c.ritualIds.length>1?"s":""}</p>
                    <h3 style={{fontFamily:F,fontSize:18,fontWeight:400,color:B.vellum,letterSpacing:"-0.005em",lineHeight:1.15,margin:"0 0 6px"}}>{c.title}</h3>
                    <p style={{fontFamily:F,fontStyle:"italic",fontSize:11.5,color:"rgba(248,242,229,0.55)",lineHeight:1.45,margin:0}}>{c.subtitle}</p>
                  </div>
                  <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14}}>
                    <span style={{fontFamily:SF,fontSize:10,color:"rgba(248,242,229,0.75)",letterSpacing:"0.04em"}}>Begin</span>
                    <ArrowRight size={11} color="rgba(248,242,229,0.75)" strokeWidth={1.5}/>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MEDITATION — single elegant row, not a card ── */}
        <div className="rhei-rise rhei-rise-4" style={{marginBottom:44}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:18}}>
            <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.7)",margin:0}}>Audio</p>
            <button onClick={()=>setScreen("meditations")} className="rhei-press" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.55)",fontFamily:SF,fontSize:10,fontWeight:400,letterSpacing:"0.18em",textTransform:"uppercase",padding:0}}>
              All →
            </button>
          </div>
          <button
            className="rhei-press"
            onClick={()=>{const locked=arc.audio.id!==1&&!isPremium;if(locked){setScreen("premium");}else{startSession(arc.audio.id);}}}
            style={{width:"100%",background:"rgba(248,242,229,0.04)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(248,242,229,0.10)",borderRadius:18,padding:"18px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg, rgba(212,173,106,0.18), rgba(196,154,75,0.06))",border:"1px solid rgba(196,154,75,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Play size={14} color={B.polished} fill={B.polished} style={{marginLeft:2}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <h3 style={{fontFamily:F,fontSize:17,color:B.vellum,margin:"0 0 3px",fontWeight:400,lineHeight:1.25,letterSpacing:"-0.005em"}}>{arc.audio.title}</h3>
              <p style={{fontFamily:F,fontStyle:"italic",fontSize:12,color:"rgba(248,242,229,0.55)",margin:0,lineHeight:1.4}}>{arc.audio.subtitle}</p>
            </div>
            <span style={{fontFamily:SF,fontSize:11,color:"rgba(248,242,229,0.45)",letterSpacing:"0.04em",flexShrink:0}}>{Math.ceil(arc.audio.duration/60)} min</span>
          </button>
        </div>

        {/* ── QUIET RELIEF — editorial grid, new copy ── */}
        <div className="rhei-rise rhei-rise-5" style={{marginBottom:44}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:18}}>
            <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.7)",margin:0}}>Quiet Relief</p>
            <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.45)",margin:0}}>Under two minutes</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {microInterventions.map(mi=>(
              <button
                key={mi.id}
                className="rhei-press"
                onClick={()=>openMicro(mi.id)}
                style={{background:"rgba(248,242,229,0.04)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(248,242,229,0.08)",borderRadius:16,padding:"16px 14px",cursor:"pointer",textAlign:"left",minHeight:118,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div>
                  <p style={{fontFamily:F,fontSize:15,color:B.vellum,margin:"0 0 4px",fontWeight:400,lineHeight:1.25,letterSpacing:"-0.005em"}}>{mi.title}</p>
                  <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.5)",margin:"0 0 8px",lineHeight:1.4}}>{mi.secondary}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                  <span style={{fontFamily:SF,fontSize:9,color:"rgba(196,154,75,0.85)",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:500}}>{mi.badge}</span>
                  <ArrowRight size={10} color="rgba(248,242,229,0.4)" strokeWidth={1.5}/>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── QUIET JOURNEY INDICATOR — discreet, hairline ── */}
        {(streak > 0 || meditationStreak > 0 || totalSessions > 0) && (
          <div className="rhei-rise rhei-rise-5" style={{marginBottom:44,paddingTop:32,borderTop:"1px solid rgba(248,242,229,0.06)"}}>
            <p style={{fontFamily:SF,fontSize:10,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:"rgba(196,154,75,0.7)",margin:"0 0 18px"}}>This week, quietly</p>
            <div style={{display:"flex",gap:0,alignItems:"baseline"}}>
              <div style={{flex:1,paddingRight:16}}>
                <p style={{fontFamily:F,fontSize:32,fontWeight:300,color:B.vellum,margin:"0",letterSpacing:"-0.02em",lineHeight:1,fontVariationSettings:"'opsz' 60"}}>{Math.max(streak, meditationStreak)}</p>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.5)",margin:"6px 0 0",lineHeight:1.4}}>days returning</p>
              </div>
              <div style={{width:1,alignSelf:"stretch",background:"rgba(248,242,229,0.08)"}}/>
              <div style={{flex:1,paddingLeft:16}}>
                <p style={{fontFamily:F,fontSize:32,fontWeight:300,color:B.vellum,margin:"0",letterSpacing:"-0.02em",lineHeight:1,fontVariationSettings:"'opsz' 60"}}>{totalSessions}</p>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:11,color:"rgba(248,242,229,0.5)",margin:"6px 0 0",lineHeight:1.4}}>moments kept</p>
              </div>
              <button onClick={()=>setScreen("journey")} className="rhei-press" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(248,242,229,0.55)",fontFamily:SF,fontSize:10,fontWeight:400,letterSpacing:"0.18em",textTransform:"uppercase",padding:0,alignSelf:"center"}}>
                Full journey →
              </button>
            </div>
          </div>
        )}

        {/* ── PREMIUM WHISPER (only if not member) ── */}
        {!isPremium && (
          <div className="rhei-rise rhei-rise-5" style={{marginBottom:24}}>
            <button
              className="rhei-press"
              onClick={()=>setScreen("premium")}
              style={{width:"100%",background:"linear-gradient(180deg, rgba(212,173,106,0.10) 0%, rgba(36,21,9,0.85) 100%)",backdropFilter:"blur(20px) saturate(1.2)",WebkitBackdropFilter:"blur(20px) saturate(1.2)",border:"1px solid rgba(196,154,75,0.22)",borderRadius:22,padding:"24px 22px",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle, rgba(212,173,106,0.18) 0%, transparent 65%)",filter:"blur(20px)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <p style={{fontFamily:SF,fontSize:9,fontWeight:500,letterSpacing:"0.32em",textTransform:"uppercase",color:B.polished,margin:"0 0 12px"}}>Membership</p>
                <h3 style={{fontFamily:F,fontSize:22,fontWeight:300,color:B.vellum,letterSpacing:"-0.015em",lineHeight:1.15,margin:"0 0 8px",maxWidth:300,fontVariationSettings:"'opsz' 60"}}>Enter the full collection.</h3>
                <p style={{fontFamily:F,fontStyle:"italic",fontSize:13,color:"rgba(248,242,229,0.6)",margin:"0 0 18px",lineHeight:1.5,maxWidth:340}}>Every ritual, every meditation. The whole practice, open to you.</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:SF,fontSize:11,color:B.polished,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:500}}>See what's inside</span>
                  <ArrowRight size={12} color={B.polished} strokeWidth={1.5}/>
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
        // Warm orb of light photograph as ambient base, with strong dark gradient overlay for legibility
        backgroundColor:B.warmBlack,
        backgroundImage:`linear-gradient(180deg, rgba(26,15,6,0.55) 0%, rgba(26,15,6,0.78) 45%, rgba(26,15,6,0.95) 100%), url('/images/player-ambient.jpg')`,
        backgroundSize:"cover",
        backgroundPosition:"center top",
        backgroundRepeat:"no-repeat",
      }}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:"60%",background:"radial-gradient(ellipse at 50% 30%, rgba(196,154,75,0.05) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <button onClick={exitPlayer} style={{position:"absolute",top:18,left:18,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.muted,fontFamily:SF,fontSize:11,letterSpacing:0.5}}><ChevronLeft size={14}/><span>Back</span></button>
        <div style={{textAlign:"center",marginTop:36,marginBottom:36}}>
          <p style={{fontSize:9,letterSpacing:3,color:B.gold,textTransform:"uppercase",fontFamily:SF,marginBottom:8}}>Audio reset</p>
          <h1 style={{fontSize:26,fontWeight:400,color:B.cream,margin:"0 0 4px",fontFamily:F}}>{cur.title}</h1>
          <p style={{fontSize:13,color:B.muted,fontStyle:"italic",fontFamily:F}}>{cur.subtitle}</p>
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
              <p style={{fontSize:14,color:B.muted,fontStyle:"italic",margin:"0 0 4px",fontFamily:F}}>{cur.title}</p>
              <p style={{fontSize:11,color:B.goldDim,fontFamily:SF,margin:"0 0 28px",letterSpacing:0.5}}>{Math.ceil(cur.duration/60)} minutes</p>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
                {[{v:`${Math.ceil(cur.duration/60)}m`,l:"Duration"},{v:completedToday.length,l:"Today"},{v:streak,l:"Streak"}].map((s,i)=>(
                  <div key={i} style={{background:B.card,borderRadius:12,padding:"12px 18px",border:`1px solid ${B.border}`}}>
                    <p style={{fontSize:18,color:B.cream,margin:0,fontFamily:SF,fontWeight:300}}>{s.v}</p>
                    <p style={{fontSize:9,color:B.muted,margin:"2px 0 0",letterSpacing:1,textTransform:"uppercase",fontFamily:SF}}>{s.l}</p>
                  </div>
                ))}
              </div>
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
      padding:"calc(env(safe-area-inset-top, 0px) + 32px) 0 140px",
      minHeight:"100vh",
      background:"linear-gradient(180deg, #0A0604 0%, #100804 38%, #0A0604 100%)",
      overflow:"hidden",
    }}>
      <DramaticGodRays intensity={0.95} pierce="50%" />

      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px"}}>

        {/* ── HERO: Luminar-style starburst + serif title ── */}
        <div className="rhei-rise rhei-rise-1" style={{
          textAlign:"center",
          paddingTop:"min(12vh, 90px)",
          marginBottom:48,
        }}>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:46, height:46, borderRadius:10,
            background:"rgba(8,5,2,0.55)",
            border:"1px solid rgba(245,200,120,0.18)",
            boxShadow:"0 0 40px rgba(245,200,120,0.30), inset 0 0 20px rgba(245,200,120,0.10)",
            marginBottom:32,
          }}>
            <Starburst size={26} />
          </div>

          <p style={{fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(245,200,120,0.75)", margin:"0 0 16px"}}>
            The Hands Room
          </p>
          <h1 style={{
            fontFamily:F, fontSize:"clamp(34px, 8.5vw, 44px)",
            fontWeight:300, color:B.vellum,
            letterSpacing:"-0.02em", lineHeight:1.05,
            margin:"0 0 14px",
            fontVariationSettings:"'opsz' 96",
            textShadow:"0 2px 20px rgba(0,0,0,0.4)",
          }}>
            Hands on the surface.
          </h1>
          <p style={{fontFamily:F, fontStyle:"italic", fontSize:14, color:"rgba(248,242,229,0.62)", lineHeight:1.55, margin:"0 auto", maxWidth:300}}>
            Seven rituals. Each with its own tool, its own pressure, its own room.
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
            <p style={{fontFamily:F, fontStyle:"italic", fontSize:14, color:"rgba(248,242,229,0.65)", lineHeight:1.5, margin:"0 0 24px", maxWidth:320, marginLeft:"auto", marginRight:"auto"}}>
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
            <p style={{fontFamily:F, fontStyle:"italic", fontSize:13, color:"rgba(248,242,229,0.60)", margin:0, lineHeight:1.5}}>
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
            const locked = r.isPremium && !isPremium;
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
                {/* Glowing orb with embossed illustration inside */}
                <div style={{
                  flexShrink:0,
                  width:64, height:64, borderRadius:"50%",
                  position:"relative",
                  background:`radial-gradient(circle, ${accent}55 0%, ${accent}18 45%, transparent 72%)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow: isRecommended ? `0 0 36px ${accent}50` : "none",
                  transition:"all 0.3s ease",
                }}>
                  <div style={{opacity:0.85, transform:"scale(0.5)"}}>
                    <RitualIllustration ritualId={r.id} zone={ritualZone} size={70}/>
                  </div>
                  {/* Inner glow dot at center */}
                  <div style={{
                    position:"absolute", top:"50%", left:"50%",
                    transform:"translate(-50%, -50%)",
                    width:8, height:8, borderRadius:"50%",
                    background:accent,
                    boxShadow:`0 0 12px ${accent}, 0 0 24px ${accent}80`,
                    opacity:0.65,
                    pointerEvents:"none",
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
                    fontFamily:F, fontStyle:"italic",
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
        {!isPremium && (
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
                fontFamily:F, fontStyle:"italic",
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
      padding:"calc(env(safe-area-inset-top, 0px) + 32px) 0 140px",
    }}>
      <DramaticGodRays intensity={1} pierce="50%" />

      <div style={{position:"relative", zIndex:1, maxWidth:480, margin:"0 auto", padding:"0 24px"}}>

        {/* ── HERO: Luminar-style centered starburst + serif title ── */}
        <div className="rhei-rise rhei-rise-1" style={{
          textAlign:"center",
          paddingTop:"min(14vh, 100px)",
          marginBottom:48,
        }}>
          {/* Streak floats in top-right corner, tiny */}
          {meditationStreak>0 && (
            <div style={{position:"absolute", top:0, right:24, display:"flex", alignItems:"baseline", gap:6}}>
              <span style={{fontFamily:F, fontSize:22, fontWeight:300, color:B.vellum, fontVariationSettings:"'opsz' 48"}}>{meditationStreak}</span>
              <span style={{fontFamily:SF, fontSize:8, letterSpacing:"0.3em", color:"rgba(248,242,229,0.45)", textTransform:"uppercase"}}>day streak</span>
            </div>
          )}

          {/* The starburst — minimal, centered, like Luminar */}
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:46, height:46, borderRadius:10,
            background:"rgba(8,5,2,0.55)",
            border:"1px solid rgba(245,200,120,0.18)",
            boxShadow:"0 0 40px rgba(245,200,120,0.30), inset 0 0 20px rgba(245,200,120,0.10)",
            marginBottom:32,
          }}>
            <Starburst size={26} />
          </div>

          <p style={{fontFamily:SF, fontSize:10, fontWeight:500, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(245,200,120,0.75)", margin:"0 0 16px"}}>
            The Audio Room
          </p>
          <h1 style={{
            fontFamily:F, fontSize:"clamp(34px, 8.5vw, 44px)",
            fontWeight:300, color:B.vellum,
            letterSpacing:"-0.02em", lineHeight:1.05,
            margin:"0 0 14px",
            fontVariationSettings:"'opsz' 96",
            textShadow:"0 2px 20px rgba(0,0,0,0.4)",
          }}>
            Step into the light.
          </h1>
          <p style={{fontFamily:F, fontStyle:"italic", fontSize:14, color:"rgba(248,242,229,0.62)", lineHeight:1.55, margin:"0 auto", maxWidth:300}}>
            Five audio rooms. Each one a different temperature of warmth.
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
            <p style={{fontFamily:F, fontStyle:"italic", fontSize:12, color:"rgba(245,200,120,0.78)", textAlign:"center", margin:"16px 0 0"}}>
              We'd guide you to <span style={{color:B.vellum, fontStyle:"normal"}}>{recommendedSession.title}</span>.
            </p>
          )}
        </div>

        {/* ── Section divider line ── */}
        <div style={{height:1, background:"linear-gradient(90deg, transparent, rgba(245,200,120,0.22), transparent)", margin:"0 -8px 36px"}}/>

        {/* ── Editorial vertical session list — gallery-program typography ── */}
        <div className="rhei-rise rhei-rise-3" style={{display:"flex", flexDirection:"column"}}>
          {sessions.map((s, idx)=>{
            const locked = s.id!==1 && !isPremium;
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
                    fontFamily:F, fontStyle:"italic",
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
        {!isPremium && (
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
                fontFamily:F, fontStyle:"italic",
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

  // ══════════ PREMIUM (replaces shop) ══════════
  const renderPremium=()=>(
    <div style={{padding:"56px 22px 120px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <Crown size={28} color={B.gold} style={{marginBottom:12}}/>
        <h1 style={{fontSize:24,fontWeight:400,color:B.cream,margin:"0 0 6px",fontFamily:F}}>The full practice.</h1>
        <p style={{fontSize:13,color:B.muted,fontStyle:"italic",fontFamily:F}}>Every ritual. Every reset. The complete arc.</p>
      </div>

      {/* What you get */}
      <div style={{background:B.card,borderRadius:18,padding:"22px 20px",marginBottom:16,border:`1px solid ${B.border}`}}>
        <p style={{fontSize:10,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 16px"}}>Everything included</p>
        {[
          {text:"Morning Reset — audio (free forever)", free:true},
          {text:"Pre-Meeting Reset — audio", free:false},
          {text:"End of Day Reset — audio", free:false},
          {text:"After Conflict Reset — audio", free:false},
          {text:"Quick Reset — audio", free:false},
          {text:"Physiological Sigh, Jaw Release, Grounding, Tap", free:true},
          {text:"Gua Sha Sculpt", free:true},
          {text:"Lymphatic Drainage", free:true},
          {text:"Face Lifting", free:true},
          {text:"Jaw Release", free:true},
          {text:"Pre-Event Glow", free:false},
          {text:"Eye Revival", free:false},
          {text:"Daily NS Score tracking", free:true},
          {text:"All future ritual guides & sessions", free:false},
          {text:"Priority access to new features", free:false},
        ].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:f.free?`#5A8A5A20`:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {f.free?<Check size={9} color={"#5A8A5A"}/>:<Crown size={9} color={B.gold}/>}
            </div>
            <span style={{fontSize:12,color:f.free?B.creamMuted:B.cream,fontFamily:SF}}>{f.text}{f.free?" ✓":""}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      {checkoutLoading && <div style={{textAlign:"center",padding:16,marginBottom:12}}><p style={{fontSize:12,color:B.muted,fontFamily:SF}}>Opening checkout...</p></div>}
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <button onClick={()=>handleCheckout('monthly')} disabled={checkoutLoading} style={{flex:1,background:B.card,borderRadius:16,padding:"20px 16px",textAlign:"center",border:`1px solid ${B.border}`,cursor:checkoutLoading?"wait":"pointer",opacity:checkoutLoading?0.6:1}}>
          <p style={{fontSize:26,color:B.cream,margin:"0 0 2px",fontFamily:SF,fontWeight:300}}>$9<span style={{fontSize:14,color:B.muted}}>.99</span></p>
          <p style={{fontSize:10,color:B.muted,margin:"0 0 8px",fontFamily:SF,textTransform:"uppercase",letterSpacing:1}}>per month</p>
          <div style={{background:`${B.gold}15`,borderRadius:12,padding:"8px",color:B.gold,fontSize:11,fontFamily:SF}}>Subscribe</div>
        </button>
        <button onClick={()=>handleCheckout('yearly')} disabled={checkoutLoading} style={{flex:1,background:B.card,borderRadius:16,padding:"20px 16px",textAlign:"center",border:`1px solid ${B.borderActive}`,cursor:checkoutLoading?"wait":"pointer",position:"relative",opacity:checkoutLoading?0.6:1}}>
          <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:B.goldGrad,padding:"3px 10px",borderRadius:10,fontSize:8,color:B.warmBlack,fontWeight:600,letterSpacing:1,fontFamily:SF,textTransform:"uppercase"}}>Save 59%</div>
          <p style={{fontSize:26,color:B.cream,margin:"0 0 2px",fontFamily:SF,fontWeight:300}}>$49</p>
          <p style={{fontSize:10,color:B.muted,margin:"0 0 8px",fontFamily:SF,textTransform:"uppercase",letterSpacing:1}}>per year</p>
          <div style={{background:B.goldGrad,borderRadius:12,padding:"8px",color:B.warmBlack,fontSize:11,fontFamily:SF,fontWeight:600}}>Best Value</div>
        </button>
      </div>

      {/* Restore / Already premium */}
      <div style={{textAlign:"center",marginTop:8}}>
        {supabase && !authUser ? (
          <div style={{background:B.card,borderRadius:14,padding:"16px 18px",border:`1px solid ${B.border}`,textAlign:"center",marginTop:8}}>
            <p style={{fontSize:11,color:B.muted,fontFamily:SF,margin:"0 0 10px"}}>Already purchased? Sign in to restore access.</p>
            <div style={{display:"flex",gap:8,maxWidth:340,margin:"0 auto"}}>
              <input type="email" placeholder="your@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signInWithEmail()} style={{flex:1,background:B.bgDeep,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.cream,fontSize:12,fontFamily:SF,outline:"none"}}/>
              <button onClick={signInWithEmail} style={{background:`${B.gold}15`,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",color:B.gold,fontSize:11,fontFamily:SF,whiteSpace:"nowrap"}}>Sign in</button>
            </div>
            {authSent && <p style={{fontSize:11,color:"#5A8A5A",fontFamily:SF,margin:"8px 0 0"}}>Check your email for a sign-in link.</p>}
            {authError && <p style={{fontSize:11,color:"#C4786A",fontFamily:SF,margin:"8px 0 0"}}>{authError}</p>}
          </div>
        ) : (
          <button onClick={()=>{
            if(authUser?.email){
              fetch('/api/check-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:authUser.email})})
                .then(r=>r.json()).then(data=>{if(data.isPremium){setIsPremium(true);save('isPremium',true);}else{alert('No active subscription found for this email.');}}).catch(()=>alert('Could not verify. Try again.'));
            } else {setIsPremium(true);save('isPremium',true);}
          }} style={{background:"none",border:"none",color:B.muted,fontSize:11,fontFamily:SF,cursor:"pointer",padding:8,textDecoration:"underline"}}>Already purchased? Restore access</button>
        )}
      </div>

    </div>
  );

  // ══════════ JOURNEY ══════════
  const renderProgress=()=>{
    const recentRituals=[...rituals].filter(r=>completedToday.length>0||totalSessions>0);
    return(
      <div style={{padding:"0 0 120px"}}>
        {/* Hero header — silhouette in water at sunset, full-width banner */}
        <div style={{
          position:"relative",
          height:280,
          marginBottom:24,
          backgroundColor:B.warmBlack,
          backgroundImage:`linear-gradient(180deg, rgba(26,15,6,0.15) 0%, rgba(26,15,6,0.05) 35%, rgba(26,15,6,0.7) 80%, rgba(26,15,6,1) 100%), url('/images/journey-hero.jpg')`,
          backgroundSize:"cover",
          backgroundPosition:"center",
          backgroundRepeat:"no-repeat",
          display:"flex",
          flexDirection:"column",
          justifyContent:"flex-end",
          padding:"0 22px 18px",
        }}>
          <p style={{fontSize:9,letterSpacing:3,color:B.cream,textTransform:"uppercase",fontFamily:SF,marginBottom:6,textShadow:"0 1px 8px rgba(0,0,0,0.5)"}}>Journey</p>
          <h1 style={{fontSize:28,fontWeight:400,color:B.cream,margin:0,fontFamily:F,textShadow:"0 2px 16px rgba(0,0,0,0.45)"}}>{userName||"Your practice"}</h1>
          <p style={{fontSize:13,color:B.creamMuted,marginTop:4,fontStyle:"italic",fontFamily:F,textShadow:"0 1px 8px rgba(0,0,0,0.5)"}}>Your face is the record of what you've shown up for.</p>
        </div>

        <div style={{padding:"0 22px"}}>

        {/* Streak — the daily return */}
        <div style={{background:B.card,borderRadius:18,padding:"22px 20px",marginBottom:14,border:`1px solid ${B.borderActive}`,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,opacity:0.06}}><Flame size={140} color={B.gold}/></div>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 14px",position:"relative"}}>Your streak</p>
          <div style={{display:"flex",alignItems:"flex-end",gap:14,marginBottom:10,position:"relative"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:6}}>
              <Flame size={26} color={B.gold} strokeWidth={1.5}/>
              <p style={{fontSize:42,color:B.cream,margin:0,fontFamily:SF,fontWeight:300,lineHeight:1}}>{meditationStreak||(completedToday.length>0?1:0)}</p>
              <p style={{fontSize:12,color:B.muted,margin:0,fontFamily:SF,letterSpacing:1}}>day{meditationStreak===1?"":"s"}</p>
            </div>
          </div>
          <p style={{fontSize:12,color:B.creamMuted,margin:"0 0 14px",fontFamily:F,fontStyle:"italic",lineHeight:1.5,position:"relative"}}>
            {meditationStreak===0&&completedToday.length===0&&"Start today. The smallest return counts."}
            {meditationStreak===0&&completedToday.length>0&&"You showed up today. That's day one."}
            {meditationStreak>=1&&meditationStreak<=3&&"You're building the pattern. The first week is the hardest."}
            {meditationStreak>=4&&meditationStreak<=7&&"This is becoming a practice. Keep returning."}
            {meditationStreak>=8&&meditationStreak<=20&&"You've made it past where most people stop."}
            {meditationStreak>20&&"This is who you are now. Quietly consistent."}
          </p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`1px solid ${B.border}`,paddingTop:12,position:"relative"}}>
            <div>
              <p style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF,margin:"0 0 2px"}}>Best ever</p>
              <p style={{fontSize:18,color:B.cream,margin:0,fontFamily:SF,fontWeight:300}}>{Math.max(longestStreak,meditationStreak,completedToday.length>0?1:0)} day{Math.max(longestStreak,meditationStreak,completedToday.length>0?1:0)===1?"":"s"}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:9,color:B.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SF,margin:"0 0 2px"}}>Today</p>
              <p style={{fontSize:18,color:completedToday.length>0?B.gold:B.muted,margin:0,fontFamily:SF,fontWeight:300}}>{completedToday.length>0?"✓ Done":"Not yet"}</p>
            </div>
          </div>
        </div>

        {/* Progression — language not numbers */}
        <div style={{background:B.card,borderRadius:18,padding:"22px 20px",marginBottom:14,border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 16px"}}>How your face is changing</p>
          {totalSessions===0?(
            <p style={{fontSize:13,color:B.muted,fontFamily:SF,fontStyle:"italic",lineHeight:1.6,margin:0}}>Complete your first ritual to begin tracking. The change is visible within a week of consistent practice.</p>
          ):(
            <div>
              {[
                { label:"Tension", text: totalSessions>=5 ? "Your jaw is releasing. Less holding between sessions." : totalSessions>=2 ? "Starting to soften." : "Your face is beginning to open.", color:"#5A8A5A" },
                { label:"Puffiness", text: totalSessions>=4 ? "Drainage is improving. Mornings look clearer." : "Building your drainage habit.", color: totalSessions>=4?"#5A8A5A":B.muted },
                { label:"Overall", text: totalSessions>=7 ? "You're becoming more balanced and more consistent." : totalSessions>=3 ? "A pattern is forming. Keep going." : "The ritual is working. You'll see it this week.", color: totalSessions>=7?"#5A8A5A":B.muted },
              ].map((item,i)=>(
                <div key={i} style={{marginBottom:i<2?14:0}}>
                  <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1}}>{item.label}</p>
                  <p style={{fontSize:13,color:item.color,fontFamily:F,fontStyle:"italic",margin:0,lineHeight:1.5}}>{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions summary */}
        <div style={{background:B.card,borderRadius:18,padding:"20px",marginBottom:14,border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 14px"}}>Your practice</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[
              {v:totalSessions,l:"Rituals completed",sub:totalSessions===0?"Start today":totalSessions===1?"Your first — well done":"Keep building"},
              {v:`${totalMinutes}m`,l:"Time invested",sub:totalMinutes>0?"In your face and nervous system":"Time well spent"},
              {v:meditationStreak>0?`${meditationStreak}`:completedToday.length>0?"1":"—",l:"Current streak",sub:longestStreak>meditationStreak?`Best: ${longestStreak}`:meditationStreak>1?"Consecutive sessions":"Complete one to start"},
              {v:completedToday.length>0?"✓":"—",l:"Practiced today",sub:completedToday.length>0?"You showed up":"Your face is waiting"},
            ].map((s,i)=>(
              <div key={i} style={{textAlign:"left"}}>
                <p style={{fontSize:26,color:B.cream,margin:"0 0 2px",fontFamily:SF,fontWeight:300}}>{s.v}</p>
                <p style={{fontSize:11,color:B.cream,margin:"0 0 1px",fontFamily:SF}}>{s.l}</p>
                <p style={{fontSize:10,color:B.muted,margin:0,fontFamily:SF}}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo journal */}
        <div style={{background:B.card,borderRadius:18,padding:"20px",marginBottom:14,border:`1px solid ${B.border}`}}>
          <p style={{fontSize:9,letterSpacing:2,color:B.gold,textTransform:"uppercase",fontFamily:SF,margin:"0 0 8px"}}>Before & after</p>
          <p style={{fontSize:12,color:B.muted,fontFamily:SF,lineHeight:1.55,margin:"0 0 14px"}}>The real measure is your face over time. Take a photo after each ritual — the change is visible within a week.</p>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,background:`${B.gold}05`,borderRadius:12,padding:"20px 12px",textAlign:"center",border:`1px dashed ${B.border}`}}>
              <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:0}}>Before</p>
            </div>
            <div style={{flex:1,background:`${B.gold}05`,borderRadius:12,padding:"20px 12px",textAlign:"center",border:`1px dashed ${B.border}`}}>
              <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:0}}>After</p>
            </div>
          </div>
          <p style={{fontSize:10,color:`${B.gold}60`,fontFamily:SF,margin:"10px 0 0",textAlign:"center"}}>Coming in next update</p>
        </div>

        {/* Profile & Account */}
        <div style={{background:B.card,borderRadius:14,padding:"16px 18px",border:`1px solid ${B.border}`,marginTop:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:authUser?12:0}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:`${B.gold}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <User size={16} color={B.gold}/>
              </div>
              <div>
                <p style={{fontSize:13,color:B.cream,margin:0,fontFamily:SF}}>{userName||"Set your name"}</p>
                <p style={{fontSize:10,color:B.muted,margin:"2px 0 0",fontFamily:SF}}>{isPremium?"Premium Member":"Free Plan"}</p>
              </div>
            </div>
            <button onClick={()=>{const n=prompt("What should we call you?",userName);if(n!==null){setUserName(n);save('userName',n);}}} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:B.muted,fontSize:10,fontFamily:SF}}>Edit</button>
          </div>
          {supabase && authUser && (
            <div style={{borderTop:`1px solid ${B.border}`,paddingTop:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Mail size={12} color={B.muted}/>
                <span style={{fontSize:11,color:B.muted,fontFamily:SF}}>{authUser.email}</span>
              </div>
              <button onClick={signOut} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:B.muted,fontSize:10,fontFamily:SF,display:"flex",alignItems:"center",gap:4}}>
                <LogOut size={10}/>Sign out
              </button>
            </div>
          )}
          {supabase && !authUser && (
            <div style={{borderTop:`1px solid ${B.border}`,paddingTop:12,marginTop:12}}>
              <p style={{fontSize:10,color:B.muted,fontFamily:SF,margin:"0 0 8px"}}>Sign in to sync your premium access across devices</p>
              <div style={{display:"flex",gap:8}}>
                <input type="email" placeholder="your@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signInWithEmail()} style={{flex:1,background:B.bgDeep,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.cream,fontSize:12,fontFamily:SF,outline:"none"}}/>
                <button onClick={signInWithEmail} style={{background:`${B.gold}15`,border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",color:B.gold,fontSize:11,fontFamily:SF,whiteSpace:"nowrap"}}>Sign in</button>
              </div>
              {authSent && <p style={{fontSize:11,color:"#5A8A5A",fontFamily:SF,margin:"8px 0 0"}}>Check your email for a sign-in link.</p>}
              {authError && <p style={{fontSize:11,color:"#C4786A",fontFamily:SF,margin:"8px 0 0"}}>{authError}</p>}
            </div>
          )}
        </div>
      </div>
      </div>
    );
  };

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
          <p style={{fontFamily:F,fontStyle:"italic",fontSize:14,color:"rgba(248,242,229,0.6)",lineHeight:1.55,margin:"0",maxWidth:340}}>
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
                  fontFamily:F, fontStyle:"italic", fontSize:13, fontWeight:400,
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
                    fontFamily:F, fontStyle:"italic", fontSize:12.5, fontWeight:400,
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
      {screen==="affirmations"&&<AffirmationsScreen onBack={()=>setScreen("home")}/>}
      {screen==="mirror"&&<FaceMirrorMode onClose={()=>setScreen("rituals")} onTransitionToReset={(id)=>startSession(id)} rituals={rituals} isPremium={isPremium}/>}
      {showCheckin&&renderCheckin()}
      {microActive&&renderMicro()}
      {activeRitual&&<RitualPlayer
        ritual={activeRitual}
        onClose={()=>setActiveRitual(null)}
        onComplete={({ritualType,totalDuration})=>{
          setTotalSessions(t=>t+1);
          setTotalMinutes(t=>t+Math.ceil(totalDuration/60));
          completeSessionOnServer('ritual',ritualType,totalDuration,checkinState?.dominant||null);
        }}
      />}
      {/* Bottom Nav — 4 tabs */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`${B.bgDeep}F2`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${B.border}`,display:"flex",justifyContent:"space-around",padding:"11px 0 env(safe-area-inset-bottom, 22px)",paddingBottom:"max(env(safe-area-inset-bottom), 22px)",zIndex:50}}>
        {navBtn("home",Home,"Today")}
        {navBtn("rituals",Sparkles,"Rituals")}
        {navBtn("meditations",Headphones,"Meditate")}
        {navBtn("affirmations",MessageCircle,"Affirm")}
        {navBtn("progress",Heart,"Journey")}
      </div>
    </div>
  );
}
